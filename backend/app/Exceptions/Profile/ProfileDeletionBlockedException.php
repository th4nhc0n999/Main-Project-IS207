<?php

namespace App\Exceptions\Profile;

use Exception;
use Illuminate\Http\JsonResponse;

class ProfileDeletionBlockedException extends Exception
{
    protected string $errorCode;

    public function __construct(
        string $message = 'Hồ sơ đang có lịch khám chờ xử lý, không thể xóa.',
        string $errorCode = 'EX-PRF-06',
        int $code = 400
    ) {
        parent::__construct($message, $code);
        $this->errorCode = $errorCode;
    }

    public function getErrorCode(): string
    {
        return $this->errorCode;
    }

    public function render($request): JsonResponse
    {
        return response()->json([
            'success' => false,
            'error_code' => $this->errorCode,
            'message' => $this->getMessage(),
        ], 400);
    }
}
