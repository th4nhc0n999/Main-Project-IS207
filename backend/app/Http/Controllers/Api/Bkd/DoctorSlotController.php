<?php

namespace App\Http\Controllers\Api\Bkd;

use App\Http\Controllers\Controller;
use App\Http\Requests\Bkd\SaveSlotRequest;
use App\Http\Requests\Bkd\SlotListRequest;
use App\Http\Resources\Bkd\ApiResource;
use App\Http\Resources\Bkd\SlotResource;
use App\Services\Bkd\DoctorSlotService;
use Illuminate\Http\Request;

class DoctorSlotController extends Controller
{
    public function __construct(private DoctorSlotService $slots) {}

    public function index(SlotListRequest $request, int $doctor): ApiResource
    {
        return new ApiResource(SlotResource::collection($this->slots->list($doctor, $request->validated('date'))));
    }

    public function own(SlotListRequest $request): ApiResource
    {
        return new ApiResource(SlotResource::collection($this->slots->listOwn($request->user(), $request->validated('date'))));
    }

    public function store(SaveSlotRequest $request)
    {
        return (new ApiResource(new SlotResource($this->slots->create($request->user(), $request->validated())),
            'Đã tạo slot bác sĩ.'))->response()->setStatusCode(201);
    }

    public function update(SaveSlotRequest $request, int $slot): ApiResource
    {
        return new ApiResource(new SlotResource($this->slots->update($request->user(), $slot, $request->validated())),
            'Đã cập nhật slot.');
    }

    public function block(Request $request, int $slot): ApiResource
    {
        return new ApiResource(new SlotResource($this->slots->block($request->user(), $slot)), 'Đã khoá slot.');
    }
}
