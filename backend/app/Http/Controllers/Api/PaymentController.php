<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\MomoIpnRequest;
use App\Http\Requests\PaymentRequest;
use App\Http\Resources\PaymentResource;
use App\Models\Booking;
use App\Services\MomoSandboxService;
use App\Services\PaymentGatewayService;
use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;
use Illuminate\Support\Facades\DB;

class PaymentController extends Controller
{
    public function start(PaymentRequest $request, PaymentGatewayService $gateway, MomoSandboxService $momo)
    {
        $this->simulationOnly();
        $data = $request->validated();
        $usesMomo = array_key_exists($data['method'], MomoSandboxService::METHODS);
        if ($usesMomo) {
            $momo->assertConfigured();
        }
        $transaction = $gateway->start($data['booking_id'], $data['method'], $request->user());
        $payload = (new PaymentResource($transaction))->resolve($request);
        if ($usesMomo) {
            $payload = array_merge($payload, $momo->checkout($transaction, $data['method'], $request->user()->email));
            // Render only the QR content returned by MoMo; never invent a wallet QR.
            if (! empty($payload['checkout']['qrCodeUrl'])) {
                $writer = new Writer(new ImageRenderer(new RendererStyle(320), new SvgImageBackEnd));
                $payload['qr_svg'] = $writer->writeString($payload['checkout']['qrCodeUrl']);
            }

            return response()->json(['success' => true, 'message' => $payload['needs_query']
                ? 'Giao dịch cần truy vấn kết quả từ MoMo.' : 'Đã tạo trang thanh toán MoMo sandbox.', 'data' => $payload]);
        }
        $payload['simulation'] = true;
        if ($data['method'] === 'qr_pay') {
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
        abort_if(str_starts_with($transaction->transaction_code, 'MOMO-'), 403, 'Giao dịch MoMo chỉ nhận kết quả từ MoMo.');
        $payment = DB::table('payments')->find($transaction->payment_id);
        $this->authorizeBooking($request, (int) $payment->booking_id);

        abort_if(array_key_exists($payment->method ?? '', MomoSandboxService::METHODS),
            403, 'Phương thức này cần kết quả từ MoMo, không dùng xác nhận giả lập.');

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

        abort_if(str_starts_with($data['transaction_code'], 'MOMO-'), 403, 'Giao dịch MoMo phải dùng IPN MoMo.');
        $payment = DB::table('payments')->where('booking_id', $data['booking_id'])->first();
        abort_if($payment && array_key_exists($payment->method ?? '', MomoSandboxService::METHODS),
            403, 'Không dùng callback giả lập cho phương thức MoMo.');

        return $this->result($request, $gateway->callback($data['booking_id'],
            $data['transaction_code'], $data['amount'], $data['status']));
    }

    public function momoIpn(MomoIpnRequest $request, MomoSandboxService $momo, PaymentGatewayService $gateway)
    {
        // MoMo's IPN protocol requires 204; browser-facing APIs keep the JSON envelope.
        $momo->ipn($request->validated(), $gateway);

        return response()->noContent();
    }

    public function momoQuery(PaymentRequest $request, string $code, MomoSandboxService $momo, PaymentGatewayService $gateway)
    {
        $transaction = DB::table('payment_transactions')->where('transaction_code', $code)->first();
        abort_unless($transaction, 404);
        $payment = DB::table('payments')->find($transaction->payment_id);
        $this->authorizeBooking($request, (int) $payment->booking_id);

        return $this->result($request, $momo->refresh($transaction, $gateway));
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
