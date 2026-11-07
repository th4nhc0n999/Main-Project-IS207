<?php

namespace App\Providers;

use App\Contracts\Bkd\BookingPayment;
use App\Contracts\Bkd\BookingRefund;
use App\Contracts\Bkd\BookingTicket;
use App\Contracts\Bkd\PatientSnapshot;
use App\Services\Bkd\Adapters\BookingPaymentAdapter;
use App\Services\Bkd\Adapters\BookingRefundAdapter;
use App\Services\Bkd\Adapters\BookingTicketAdapter;
use App\Services\Bkd\Adapters\PatientSnapshotAdapter;
use Illuminate\Support\ServiceProvider;

class BkdServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // No DevStubs exist. Every environment uses the real services by default.
        $this->app->bind(PatientSnapshot::class, PatientSnapshotAdapter::class);
        $this->app->bind(BookingPayment::class, BookingPaymentAdapter::class);
        $this->app->bind(BookingRefund::class, BookingRefundAdapter::class);
        $this->app->bind(BookingTicket::class, BookingTicketAdapter::class);
    }
}
