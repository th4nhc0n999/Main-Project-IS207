<?php

namespace App\Http\Middleware;

use App\Exceptions\Booking\InvalidBookingTransitionException;
use Closure;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Throwable;

class PaymentApi
{
    public function handle(Request $request, Closure $next)
    {
        try {
            $response = $next($request);
            if ($response->getStatusCode() >= 400) {
                $body = json_decode($response->getContent(), true) ?? [];
                $message = $response->getStatusCode() >= 500
                    ? 'Không thể xử lý thanh toán. Vui lòng kiểm tra lại giao dịch.'
                    : (collect($body['errors'] ?? [])->flatten()->first() ?? $body['message'] ?? 'Không được phép thực hiện.');

                // Preserve the shared auth middleware's safe recovery details.
                $details = array_intersect_key($body, array_flip([
                    'status', 'require_password_change', 'remaining_minutes',
                ]));

                return response()->json(['success' => false, 'message' => $message,
                    'data' => $details ?: null], $response->getStatusCode());
            }

            return $response;
        } catch (Throwable $error) {
            $status = match (true) {
                $error instanceof ValidationException, $error instanceof InvalidBookingTransitionException => 422,
                $error instanceof AuthenticationException => 401,
                $error instanceof ModelNotFoundException => 404,
                $error instanceof HttpExceptionInterface => $error->getStatusCode(),
                default => 500,
            };
            if ($status === 500) {
                report($error);
            }
            $message = $error instanceof ValidationException
                ? collect($error->errors())->flatten()->first()
                : ($status === 500 ? 'Không thể xử lý thanh toán. Vui lòng kiểm tra lại giao dịch.' : $error->getMessage());

            return response()->json(['success' => false, 'message' => $message ?: 'Không được phép thực hiện.', 'data' => null], $status);
        }
    }
}
