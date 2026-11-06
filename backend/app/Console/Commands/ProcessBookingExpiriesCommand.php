<?php

namespace App\Console\Commands;

use App\Jobs\ProcessBookingExpiriesJob;
use App\Services\AuditLogger;
use App\Services\BookingStateMachine;
use Illuminate\Console\Command;

class ProcessBookingExpiriesCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'medsi:process-expiries';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Xử lý các lịch hết hạn giữ chỗ (T03), hết hạn duyệt (T07) và kiểm tra đủ điều kiện No-Show';

    /**
     * Execute the console command.
     */
    public function handle(BookingStateMachine $stateMachine, AuditLogger $auditLogger): int
    {
        $this->info('Starting MedSi booking expiry processing...');

        $job = new ProcessBookingExpiriesJob();
        $result = $job->handle($stateMachine, $auditLogger);

        $this->info("Completed: Expired holds (T03): {$result['expired_holds']}, Expired approvals (T07): {$result['expired_approvals']}, No-show eligible: {$result['no_show_eligible']}");

        return Command::SUCCESS;
    }
}

