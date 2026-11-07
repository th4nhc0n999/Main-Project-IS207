<?php

namespace App\Http\Controllers;

use App\Models\Ticket;
use App\Services\BookingReadService;
use App\Services\TicketQrService;
use App\Services\TicketService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class TicketController extends Controller
{
    public function show(Request $request, int $booking, BookingReadService $read, TicketQrService $qr): JsonResponse
    {
        $data = $read->detail($request->user(), $booking);
        $ticket = Ticket::query()->where('booking_id', $booking)->firstOrFail();
        $data['ticket']['qr_token'] = $ticket->qr_token;
        $data['ticket']['qr_png_data_uri'] = 'data:image/png;base64,'.base64_encode($qr->png($ticket->qr_token));

        return response()->json(['data' => $data])->header('Cache-Control', 'private, no-store');
    }

    public function download(Request $request, int $booking, BookingReadService $read, TicketQrService $qr): Response
    {
        $read->detail($request->user(), $booking);
        $ticket = Ticket::query()->where('booking_id', $booking)->firstOrFail();

        return response($qr->png($ticket->qr_token), 200, [
            'Content-Type' => 'image/png',
            'Content-Disposition' => 'attachment; filename="'.$ticket->ticket_code.'.png"',
            'Cache-Control' => 'private, no-store',
        ]);
    }

    public function checkIn(Request $request, TicketService $tickets): JsonResponse
    {
        abort_unless(in_array($request->user()->role, ['staff', 'admin'], true), 403);
        $data = $request->validate(['qr_token' => ['required', 'string', 'max:512']]);
        $ticket = $tickets->checkIn($data['qr_token'], $request->user(), $request->ip());

        return response()->json(['message' => 'Check-in thành công.', 'data' => $ticket]);
    }
}
