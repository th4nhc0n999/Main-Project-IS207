<?php

namespace App\Exceptions\Booking;

use App\Http\Resources\Bkd\ApiResource;
use Illuminate\Http\Request;
use RuntimeException;

class BkdException extends RuntimeException
{
    public function __construct(string $message, public readonly int $httpStatus = 409,
        public readonly string $errorCode = 'BKD_CONFLICT')
    {
        parent::__construct($message);
    }

    public function render(Request $request)
    {
        return (new ApiResource(null, $this->getMessage(), false, $this->errorCode))
            ->response()->setStatusCode($this->httpStatus);
    }

    public function report(): bool
    {
        return true; // Expected business/dependency error; no sensitive exception context in logs.
    }
}
