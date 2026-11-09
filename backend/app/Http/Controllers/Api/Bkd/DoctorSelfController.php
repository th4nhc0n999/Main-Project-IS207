<?php

namespace App\Http\Controllers\Api\Bkd;

use App\Http\Controllers\Controller;
use App\Http\Resources\Bkd\ApiResource;
use App\Services\Bkd\DoctorSlotService;
use Illuminate\Http\Request;

class DoctorSelfController extends Controller
{
    public function __construct(private DoctorSlotService $slots) {}

    public function show(Request $request): ApiResource
    {
        return new ApiResource($this->slots->profileFor($request->user()));
    }
}
