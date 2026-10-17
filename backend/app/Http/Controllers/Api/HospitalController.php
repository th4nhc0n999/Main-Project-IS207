<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\BusinessException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Hospital\SearchHospitalRequest;
use App\Http\Requests\Hospital\StoreHospitalBookingRequest;
use App\Http\Resources\BookingResource;
use App\Http\Resources\HospitalResource;
use App\Services\BookingService;
use App\Services\HospitalService;
use Illuminate\Http\JsonResponse;

class HospitalController extends Controller
{
    public function __construct(private HospitalService $hospitals, private BookingService $bookings) {}

    public function index(SearchHospitalRequest $request): JsonResponse
    {
        $result = $this->hospitals->search($request->validated());
        return response()->json([
            'success' => true, 'message' => 'Danh sách bệnh viện.',
            'data' => HospitalResource::collection($result->items()),
            'pagination' => [
                'current_page' => $result->currentPage(), 'last_page' => $result->lastPage(),
                'total' => $result->total(),
            ],
        ]);
    }

    public function show(int $id): JsonResponse
    {
        try {
            return response()->json([
                'success' => true, 'message' => 'Thông tin bệnh viện.',
                'data' => new HospitalResource($this->hospitals->getDetail($id)),
            ]);
        } catch (BusinessException $e) {
            return $this->businessError($e);
        }
    }

    public function book(StoreHospitalBookingRequest $request): JsonResponse
    {
        try {
            $booking = $this->bookings->createHospitalBooking(
                (int) $request->user()->id, $request->validated()
            );
            return response()->json([
                'success' => true, 'message' => 'Đã giữ chỗ. Vui lòng tiếp tục thanh toán.',
                'data' => (new BookingResource($booking))->resolve($request) + [
                    'slot_hold_expires_at' => $booking->slot_hold_expires_at?->toIso8601String(),
                ],
            ], 201);
        } catch (BusinessException $e) {
            return $this->businessError($e);
        }
    }

    private function businessError(BusinessException $e): JsonResponse
    {
        return response()->json([
            'success' => false, 'message' => $e->getMessage(), 'data' => null,
        ], $e->getStatusCode());
    }
}
