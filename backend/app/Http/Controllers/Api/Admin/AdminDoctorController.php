<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\AuditEvent;
use App\Enums\UserStatus;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Symfony\Component\HttpFoundation\Response;

class AdminDoctorController extends Controller
{
    /**
     * Admin creates a doctor user account in pending status and links doctors.user_id (S4-12, AU-20).
     */
    public function createDoctorAccount(Request $request, AuditLogger $auditLogger): JsonResponse
    {
        $validated = $request->validate([
            'doctor_id' => ['required', 'integer', 'exists:doctors,id'],
            'name' => ['required', 'string', 'max:150'],
            'email' => ['required', 'string', 'email', 'max:150', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'phone' => ['nullable', 'string', 'max:20'],
        ]);

        $admin = $request->user();

        return DB::transaction(function () use ($validated, $admin, $auditLogger) {
            $doctor = DB::table('doctors')->where('id', $validated['doctor_id'])->lockForUpdate()->first();

            if (! $doctor) {
                return response()->json(['message' => 'Không tìm thấy hồ sơ bác sĩ.'], Response::HTTP_NOT_FOUND);
            }

            if ($doctor->user_id !== null) {
                return response()->json([
                    'message' => 'Bác sĩ này đã có tài khoản người dùng liên kết.',
                ], Response::HTTP_UNPROCESSABLE_ENTITY);
            }

            // Create user with pending status, role doctor, hospital_id null (as per ck_users_scope constraint)
            $user = User::create([
                'name' => $validated['name'],
                'email' => strtolower(trim($validated['email'])),
                'password' => Hash::make($validated['password']),
                'phone' => $validated['phone'] ?? null,
                'role' => 'doctor',
                'status' => UserStatus::PENDING,
                'hospital_id' => null,
                'failed_login_count' => 0,
            ]);

            // Link doctor record to user
            DB::table('doctors')->where('id', $doctor->id)->update([
                'user_id' => $user->id,
                'updated_at' => now(),
            ]);

            $auditLogger->log(
                AuditEvent::AU_20,
                'user',
                $user->id,
                $admin,
                [
                    'doctor_id' => $doctor->id,
                    'user_id' => $user->id,
                    'email' => $user->email,
                    'status' => 'pending',
                ],
                'Admin tạo tài khoản bác sĩ'
            );

            return response()->json([
                'message' => 'Tạo tài khoản bác sĩ thành công. Trạng thái tài khoản: pending (chờ đổi mật khẩu lần đầu).',
                'doctor' => [
                    'id' => $doctor->id,
                    'name' => $doctor->name,
                    'user_id' => $user->id,
                    'email' => $user->email,
                    'status' => 'pending',
                ],
            ], Response::HTTP_CREATED);
        });
    }
}

