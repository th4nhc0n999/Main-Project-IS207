<?php

namespace App\Http\Resources\Bkd;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ApiResource extends JsonResource
{
    public static $wrap = null;

    public function __construct(mixed $resource = null, private string $message = 'Thành công.',
        private bool $success = true, private ?string $errorCode = null, private array $errors = [])
    {
        parent::__construct($resource);
    }

    public function toArray(Request $request): array
    {
        $result = ['success' => $this->success, 'message' => $this->message, 'data' => $this->resource];
        if ($this->errorCode !== null) {
            $result['code'] = $this->errorCode;
        }
        if ($this->errors !== []) {
            $result['errors'] = $this->errors;
        }

        return $result;
    }
}
