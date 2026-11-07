<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureStaffHospitalScope
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->role === 'staff' && empty($user->hospital_id)) {
            return response()->json([
                'message' => 'Tài khoản nhân viên cơ sở bắt buộc phải được gắn với một bệnh viện/cơ sở y tế.',
            ], Response::HTTP_FORBIDDEN);
        }

        return $next($request);
    }
}

