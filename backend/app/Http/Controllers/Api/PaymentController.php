<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\PaymentRequest;
use App\Http\Resources\PaymentResource;
use App\Models\Booking;
use App\Services\PaymentGatewayService;
use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;
use Illuminate\Support\Facades\DB;

class PaymentController extends Controller
{
    public function start(PaymentRequest $request, PaymentGatewayService $gateway)
    {
        $this->simulationOnly();
        $data = $request->validated();
        $transaction = $gateway->start($data['booking_id'], $data['method'], $request->user());
        $payload = (new PaymentResource($transaction))->resolve($request);
        $payload['simulation'] = true;
        if (in_array($data['method'], ['qr_pay', 'momo'], true)) {
            $qr = json_encode(['type' => 'medsi_simulated_payment',
                'transaction_code' => $transaction->transaction_code, 'amount' => (int) $transaction->amount]);
            $writer = new Writer(new ImageRenderer(new RendererStyle(320), new SvgImageBackEnd));
            $payload['qr_svg'] = $writer->writeString($qr);
        }

        return response()->json(['success' => true, 'message' => 'Đã tạo giao dịch giả lập.', 'data' => $payload]);
    }

    public function show(PaymentRequest $request, int $booking)
    {
        $this->authorizeBooking($request, $booking);
        $payment = DB::table('payments')->where('booking_id', $booking)->first();
        abort_unless($payment, 404);

        return $this->result($request, $payment);
    }

    public function simulate(PaymentRequest $request, PaymentGatewayService $gateway)
    {
        $this->simulationOnly();
        $data = $request->validated();
        $transaction = DB::table('payment_transactions')->where('transaction_code', $data['transaction_code'])->first();
        abort_unless($transaction && $transaction->source === 'gateway', 404);
        $payment = DB::table('payments')->find($transaction->payment_id);
        $this->authorizeBooking($request, (int) $payment->booking_id);

        return $this->result($request, $gateway->callback($payment->booking_id,
            $transaction->transaction_code, (int) $transaction->amount, $data['status']));
    }

    public function transaction(PaymentRequest $request, string $code)
    {
        $transaction = DB::table('payment_transactions')->where('transaction_code', $code)->first();
        abort_unless($transaction, 404);
        $payment = DB::table('payments')->find($transaction->payment_id);
        $this->authorizeBooking($request, (int) $payment->booking_id);

        return $this->result($request, $transaction);
    }

    public function callback(PaymentRequest $request, PaymentGatewayService $gateway)
    {
        $this->simulationOnly();
        $secret = (string) config('services.medsi_gateway.secret');
        abort_unless($secret !== '' && hash_equals(hash_hmac('sha256', $request->getContent(), $secret),
            (string) $request->header('X-MedSi-Signature')), 403, 'Chữ ký cổng thanh toán không hợp lệ.');
        $data = $request->validated();

        return $this->result($request, $gateway->callback($data['booking_id'],
            $data['transaction_code'], $data['amount'], $data['status']));
    }

    private function authorizeBooking(PaymentRequest $request, int $id): void
    {
        $booking = Booking::query()->findOrFail($id);
        $user = $request->user();
        abort_unless($user->status->value === 'active' && ($user->role === 'admin'
            || ($user->role === 'patient' && (int) $booking->user_id === (int) $user->id)), 403);
    }

    private function simulationOnly(): void
    {
        abort_unless(app()->environment(['local', 'testing']), 403, 'Chỉ dùng cổng giả lập trong môi trường thử nghiệm.');
    }

    private function result(PaymentRequest $request, object $result)
    {
        return response()->json(['success' => true, 'message' => 'Đã xử lý yêu cầu.',
            'data' => (new PaymentResource($result))->resolve($request)]);
    }
}
