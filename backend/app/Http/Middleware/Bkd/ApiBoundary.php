<?php

namespace App\Http\Middleware\Bkd;

use App\Exceptions\Booking\BkdException;
use App\Exceptions\Booking\InvalidBookingTransitionException;
use App\Exceptions\Booking\SlotUnavailableException;
use App\Http\Resources\Bkd\ApiResource;
use Closure;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

class ApiBoundary
{
    public function handle(Request $request, Closure $next)
    {
        $request->headers->set('Accept', 'application/json');
        try {
            $response = $next($request);
            // Laravel's routing pipeline may render exceptions before returning here.
            if ($response->getStatusCode() >= 400) {
                $body = json_decode($response->getContent(), true) ?? [];
                $status = $response->getStatusCode();
                if ($status >= 500 && ($body['code'] ?? '') !== 'BKD_INTEGRATION_UNAVAILABLE') {
                    return $this->error('Không thể xử lý yêu cầu lúc này. Vui lòng thử lại.', $status, 'BKD_UNAVAILABLE');
                }

                return $this->error($body['message'] ?? 'Yêu cầu không hợp lệ.', $status,
                    $body['code'] ?? match ($status) {
                        401 => 'UNAUTHENTICATED', 403 => 'FORBIDDEN', 404 => 'NOT_FOUND',
                        422 => 'VALIDATION_ERROR', default => 'HTTP_ERROR',
                    }, $body['errors'] ?? []);
            }

            return $response;
        } catch (ValidationException $e) {
            return $this->error('Dữ liệu không hợp lệ.', 422, 'VALIDATION_ERROR', $e->errors());
        } catch (AuthenticationException $e) {
            return $this->error('Vui lòng đăng nhập.', 401, 'UNAUTHENTICATED');
        } catch (AuthorizationException $e) {
            return $this->error('Bạn không có quyền thực hiện thao tác này.', 403, 'FORBIDDEN');
        } catch (ModelNotFoundException $e) {
            return $this->error('Không tìm thấy dữ liệu.', 404, 'NOT_FOUND');
        } catch (SlotUnavailableException $e) {
            return $this->error($e->getMessage(), 409, 'SE001');
        } catch (BkdException $e) {
            return $this->error($e->getMessage(), $e->httpStatus, $e->errorCode);
        } catch (InvalidBookingTransitionException $e) {
            return $this->error($e->getMessage(), 422, 'INVALID_BOOKING_TRANSITION');
        } catch (HttpExceptionInterface $e) {
            return $this->error('Yêu cầu không được phép hoặc không tìm thấy.', $e->getStatusCode(), 'HTTP_ERROR');
        } catch (QueryException $e) {
            // Never send SQL/bindings (which may include a snapshot) to the client.
            return $this->error('Không thể xử lý dữ liệu lúc này. Vui lòng thử lại.', 503, 'DATABASE_UNAVAILABLE');
        }
    }

    private function error(string $message, int $status, string $code, array $errors = [])
    {
        return (new ApiResource(null, $message, false, $code, $errors))->response()->setStatusCode($status);
    }
}
