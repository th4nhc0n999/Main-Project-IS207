<?php

namespace App\Http\Controllers\Api\Bkd;

use App\Http\Controllers\Controller;
use App\Http\Requests\Bkd\BookingListRequest;
use App\Http\Requests\Bkd\CancelBookingRequest;
use App\Http\Requests\Bkd\CreateBookingRequest;
use App\Http\Requests\Bkd\DecisionRequest;
use App\Http\Resources\Bkd\ApiResource;
use App\Http\Resources\Bkd\BookingResource;
use App\Services\Bkd\DoctorBookingService;
use Illuminate\Http\Request;

class DoctorBookingController extends Controller
{
    public function __construct(private DoctorBookingService $bookings) {}

    public function store(CreateBookingRequest $request): ApiResource
    {
        return $this->result($this->bookings->create($request->user(), $request->validated()), 'Đã ghi nhận yêu cầu đặt lịch.');
    }

    public function index(BookingListRequest $request): ApiResource
    {
        $page = $this->bookings->listing($request->user(), $request->validated(), $request->routeIs('bkd.doctor.index'));
        $page->getCollection()->each(fn ($booking) => $this->bookings->present($booking));

        return new ApiResource([
            'items' => BookingResource::collection($page->getCollection()),
            'pagination' => ['current_page' => $page->currentPage(), 'per_page' => $page->perPage(),
                'total' => $page->total(), 'last_page' => $page->lastPage()],
            'server_time' => now()->toIso8601String(),
        ]);
    }

    public function show(Request $request, int $booking): ApiResource
    {
        return $this->result($this->bookings->detail($request->user(), $booking));
    }

    public function approve(DecisionRequest $request, int $booking): ApiResource
    {
        return $this->result($this->bookings->decide($request->user(), $booking, true, $request->validated()), 'Đã xác nhận lịch.');
    }

    public function reject(DecisionRequest $request, int $booking): ApiResource
    {
        return $this->result($this->bookings->decide($request->user(), $booking, false, $request->validated()), 'Đã từ chối và yêu cầu hoàn tiền.');
    }

    public function cancel(CancelBookingRequest $request, int $booking): ApiResource
    {
        return $this->result($this->bookings->cancel($request->user(), $booking, $request->validated()), 'Đã huỷ lịch. Khoản hoàn được xử lý riêng nếu có.');
    }

    private function result($booking, string $message = 'Thành công.'): ApiResource
    {
        return new ApiResource(new BookingResource($this->bookings->present($booking)), $message);
    }
}
