<?php

namespace App\Http\Controllers;

use App\Enums\BookingStatus;
use App\Services\BookingReadService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class BookingHistoryController extends Controller
{
    public function index(Request $request, BookingReadService $read): JsonResponse
    {
        $data = $request->validate([
            'tab' => ['nullable', Rule::in(['upcoming', 'completed', 'closed'])],
            'status' => ['nullable', Rule::in([...array_column(BookingStatus::cases(), 'value'), 'all'])],
            'q' => ['nullable', 'string', 'max:100'], 'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);
        $query = $read->query($request->user())->where('b.user_id', $request->user()->id);
        if (isset($data['tab'])) {
            $query->whereIn('b.status', match ($data['tab']) {
                'upcoming' => ['pending_payment', 'pending_approval', 'confirmed', 'checked_in'],
                'completed' => ['completed'],
                'closed' => ['cancelled', 'expired', 'rejected', 'no_show'],
            });
        }
        if (isset($data['status']) && $data['status'] !== 'all') {
            $query->where('b.status', $data['status']);
        }
        if (isset($data['q']) && trim($data['q']) !== '') {
            $term = '%'.addcslashes(trim($data['q']), '%_\\').'%';
            $query->where(fn ($query) => $query->where('t.ticket_code', 'like', $term)->orWhere('b.code', 'like', $term)
                ->orWhere('h.name', 'like', $term)->orWhere('d.name', 'like', $term));
        }
        $page = $query->orderByDesc('s.work_date')->orderByDesc('b.id')->paginate($data['per_page'] ?? 20);

        return response()->json([
            'data' => $page->getCollection()->map(fn ($row) => $read->serialize($row)),
            'pagination' => ['current_page' => $page->currentPage(), 'last_page' => $page->lastPage(), 'total' => $page->total()],
        ]);
    }
}
