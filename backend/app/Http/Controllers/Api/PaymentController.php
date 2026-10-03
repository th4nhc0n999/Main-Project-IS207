<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\BusinessException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Payment\CalculateInvoiceRequest;
use App\Http\Requests\Payment\ConfirmPaymentRequest;
use App\Http\Requests\Payment\CreatePaymentRequest;
use App\Http\Resources\InvoiceResource;
use App\Http\Resources\PaymentResource;
use App\Services\PaymentService;
use DomainException;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;
use Throwable;

class PaymentController extends Controller
{
    public function __construct(
        protected PaymentService $paymentService
    ) {}

    public function calculateInvoice(CalculateInvoiceRequest $request): JsonResponse
    {
        try {
            $invoice = $this->paymentService->calculateInvoice(
                $request->input('booking_id'),
                $this->userId($request)
            );

            return response()->json([
                'success' => true,
                'message' => 'Lấy thông tin bảng kê thanh toán thành công.',
                'data' => new InvoiceResource($invoice),
                'errors' => null,
            ]);
        } catch (Throwable $exception) {
            return $this->errorResponse($exception);
        }
    }

    public function createPayment(CreatePaymentRequest $request): JsonResponse
    {
        try {
            $payment = $this->paymentService->createPayment(
                $request->input('booking_id'),
                $request->input('method'),
                $this->userId($request)
            );

            return response()->json([
                'success' => true,
                'message' => 'Khởi tạo thông tin thanh toán thành công.',
                'data' => new PaymentResource($payment),
                'errors' => null,
            ], 201);
        } catch (Throwable $exception) {
            return $this->errorResponse($exception);
        }
    }

    /**
     * Điểm xác nhận phục vụ luồng gateway giả lập của Mini Project.
     */
    public function confirmPayment(ConfirmPaymentRequest $request): JsonResponse
    {
        return $this->processPayment($request);
    }

    public function processPayment(ConfirmPaymentRequest $request): JsonResponse
    {
        try {
            $paymentId = $request->input('payment_id');
            if (! $paymentId && $request->filled('booking_id')) {
                $payment = $this->paymentService->createPayment(
                    $request->input('booking_id'),
                    $request->input('method', 'qr_pay'),
                    $this->userId($request)
                );
                $paymentId = $payment->id;
            }

            $payment = $this->paymentService->processPayment(
                (int) $paymentId,
                $this->userId($request),
                $request->input('otp')
            );

            return response()->json([
                'success' => true,
                'message' => 'Thanh toán thành công. Lịch hẹn khám đã được xác nhận!',
                'data' => new PaymentResource($payment),
                'errors' => null,
            ]);
        } catch (Throwable $exception) {
            return $this->errorResponse($exception);
        }
    }

    public function show(Request $request, int $id): JsonResponse
    {
        try {
            $payment = $this->paymentService->getPayment($id, $this->userId($request));

            return response()->json([
                'success' => true,
                'message' => 'Lấy chi tiết giao dịch thành công.',
                'data' => new PaymentResource($payment),
                'errors' => null,
            ]);
        } catch (Throwable $exception) {
            return $this->errorResponse($exception);
        }
    }

    public function cancel(Request $request, int $id): JsonResponse
    {
        try {
            $payment = $this->paymentService->cancelPayment(
                $id,
                $this->userId($request)
            );

            return response()->json([
                'success' => true,
                'message' => $payment->isExpired() ? 'Giao dịch thanh toán đã hết hạn.' : 'Đã hủy giao dịch thanh toán.',
                'data' => new PaymentResource($payment),
                'errors' => null,
            ]);
        } catch (Throwable $exception) {
            return $this->errorResponse($exception);
        }
    }

    private function userId(Request $request): int
    {
        return (int) $request->user()->getAuthIdentifier();
    }

    private function errorResponse(Throwable $exception): JsonResponse
    {
        [$status, $message] = match (true) {
            $exception instanceof BusinessException => [$exception->getStatusCode(), $exception->getMessage()],
            $exception instanceof ModelNotFoundException => [404, 'Không tìm thấy dữ liệu thanh toán phù hợp.'],
            $exception instanceof AuthorizationException => [403, $exception->getMessage()],
            $exception instanceof InvalidArgumentException => [422, $exception->getMessage()],
            $exception instanceof DomainException => [409, $exception->getMessage()],
            default => [500, 'Đã xảy ra lỗi khi xử lý thanh toán. Vui lòng thử lại.'],
        };

        if ($status === 500) {
            report($exception);
        }

        return response()->json([
            'success' => false,
            'message' => $message,
            'data' => null,
            'errors' => null,
        ], $status);
    }
}
