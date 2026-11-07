<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\PaymentRequest;
use App\Http\Resources\PaymentResource;
use App\Services\PaymentGatewayService;
use App\Services\RefundService;

class PaymentController extends Controller
{
    public function counter(PaymentRequest $request, int $booking, PaymentGatewayService $gateway)
    {
        $this->simulationOnly();

        return $this->result($request, $gateway->confirmCounter($booking, $request->user()));
    }

    public function refund(PaymentRequest $request, int $refund, RefundService $service)
    {
        $this->simulationOnly();

        return $this->result($request, $service->transition($refund, $request->validated('status'), $request->user()));
    }

    private function simulationOnly(): void
    {
        abort_unless(app()->environment(['local', 'testing']), 403, 'Chỉ dùng chức năng mô phỏng trong môi trường thử nghiệm.');
    }

    private function result(PaymentRequest $request, object $result)
    {
        return response()->json(['success' => true, 'message' => 'Đã xử lý yêu cầu.',
            'data' => (new PaymentResource($result))->resolve($request)]);
    }
}
