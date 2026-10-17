<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Kiểm tra user hiện tại có đúng role được phép hay không.
     * Sử dụng: middleware('role:admin') hoặc middleware('role:admin,doctor')
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (!$user || !in_array($user->role, $roles)) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn không có quyền truy cập chức năng này.',
                'data'    => null,
                'errors'  => null,
            ], 403);
        }

        return $next($request);
    }
}
