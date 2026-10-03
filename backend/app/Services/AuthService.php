<?php

namespace App\Services;

use App\Exceptions\Auth\InvalidCredentialsException;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AuthService
{
    /**
     * Đăng ký tài khoản người dùng mới và tạo Sanctum token.
     *
     * @param  array<string, mixed>  $data
     * @return array{user: User, token: string}
     */

    public function register(array $data): array
    {
        // Bước 1: Tạo bản ghi User mới trong database
        // Bắt buộc dùng Hash::make() để không lưu mật khẩu thô (plain text)
        $user = User::create([
            'name'     => $data['name'],
            'email'    => $data['email'],
            'password' => Hash::make($data['password']),
            'phone'    => $data['phone'] ?? null,
            'role'     => $data['role'] ?? 'patient', // Mặc định role là patient
        ]);
        // Bước 2: Tạo Sanctum Token cho User vừa tạo
        // Tên token 'auth_token' giúp nhận diện mục đích sử dụng
        $token = $user->createToken('auth_token')->plainTextToken;
        // Bước 3: Trả về dữ liệu để Controller bọc vào JSON Response
        return [
            'user'  => $user,
            'token' => $token,
        ];
    }

        /**
     * Xác thực thông tin đăng nhập và tạo token Sanctum mới.
     *
     * @param  array<string, mixed>  $credentials
     * @return array{user: User, token: string}
     *
     * @throws InvalidCredentialsException
     */
    public function login(array $credentials): array
    {
        // Bước 1: Tìm tài khoản trong DB theo email
        $user = User::where('email', $credentials['email'])->first();

        // Bước 2: Kiểm tra 2 điều kiện:
        // - User có tồn tại không? (! $user)
        // - Mật khẩu người dùng nhập có khớp với mật khẩu đã hash trong DB không?
        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            // Ném lỗi 401 nếu sai email HOẶC sai mật khẩu
            throw new InvalidCredentialsException();
        }

        // Bước 3: Đăng nhập đúng -> Cấp Sanctum token mới
        $token = $user->createToken('auth_token')->plainTextToken;

        return [
            'user'  => $user,
            'token' => $token,
        ];
    }

        /**
     * Đăng xuất: Thu hồi token hiện tại của người dùng.
     *
     * @param  User  $user
     * @return bool
     */
    public function logout(User $user): bool
    {
        // Xóa token hiện tại mà client dùng để gửi request này
        $user->currentAccessToken()?->delete();

        return true;
    }

    /**
     * Cập nhật thông tin tài khoản người dùng.
     *
     * @param  User  $user
     * @param  array<string, mixed>  $data
     * @return User
     */
    public function updateProfile(User $user, array $data): User
    {
        $user->fill($data);
        $user->save();

        return $user->fresh();
    }
}
