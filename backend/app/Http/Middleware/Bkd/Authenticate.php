<?php

namespace App\Http\Middleware\Bkd;

use App\Http\Resources\Bkd\ApiResource;
use Illuminate\Http\Exceptions\HttpResponseException;

class Authenticate extends \Illuminate\Auth\Middleware\Authenticate
{
    protected function unauthenticated($request, array $guards)
    {
        throw new HttpResponseException((new ApiResource(null, 'Vui lòng đăng nhập.', false, 'UNAUTHENTICATED'))
            ->response()->setStatusCode(401));
    }
}
