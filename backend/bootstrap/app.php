<?php

use App\Exceptions\Booking\InvalidBookingTransitionException;
use App\Exceptions\Booking\SlotUnavailableException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Preserve the PAY response envelope for authentication failures as well.
        $middleware->prependToPriorityList(
            \Illuminate\Contracts\Auth\Middleware\AuthenticatesRequests::class,
            \App\Http\Middleware\PaymentApi::class,
        );

        $middleware->alias([
            'role' => \App\Http\Middleware\EnsureUserRole::class,
            'active' => \App\Http\Middleware\EnsureUserActive::class,
            'staff.hospital' => \App\Http\Middleware\EnsureStaffHospitalScope::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (SlotUnavailableException $exception, Request $request) {
            if (! $request->is('api/*')) {
                return null;
            }

            return response()->json([
                'success' => false,
                'message' => $exception->getMessage(),
                'code' => $exception->errorCode(),
            ], 409);
        });

        $exceptions->render(function (InvalidBookingTransitionException $exception, Request $request) {
            if (! $request->is('api/*')) {
                return null;
            }

            return response()->json([
                'success' => false,
                'message' => $exception->getMessage(),
                'code' => 'INVALID_BOOKING_TRANSITION',
            ], 422);
        });
    })->create();
