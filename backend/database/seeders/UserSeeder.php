<?php

namespace Database\Seeders;

use App\Models\Hospital;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $hospitalChoRay = Hospital::where('name', 'Bệnh viện Chợ Rẫy')->first();
        $choRayId = $hospitalChoRay ? $hospitalChoRay->id : 1;

        $hospitalBachMai = Hospital::where('name', 'Bệnh viện Bạch Mai')->first();
        $bachMaiId = $hospitalBachMai ? $hospitalBachMai->id : 4;

        // 1. Quản trị viên (Admin)
        User::updateOrCreate(
            ['email' => 'admin@medsi.vn'],
            [
                'name' => 'Hệ Thống Quản Trị MedSi',
                'password' => Hash::make('Admin@123456'),
                'phone' => '0901000001',
                'role' => 'admin',
                'status' => 'active',
                'hospital_id' => null,
            ]
        );

        // 2. Ba Bác sĩ mẫu (liên kết với bảng doctors qua user_id)
        User::updateOrCreate(
            ['email' => 'doctor1@medsi.vn'],
            [
                'name' => 'BS.CKII Nguyễn Văn An',
                'password' => Hash::make('Doctor@123456'),
                'phone' => '0902000001',
                'role' => 'doctor',
                'status' => 'active',
                'hospital_id' => null,
            ]
        );

        User::updateOrCreate(
            ['email' => 'doctor2@medsi.vn'],
            [
                'name' => 'ThS.BS Trần Thị Mai',
                'password' => Hash::make('Doctor@123456'),
                'phone' => '0902000002',
                'role' => 'doctor',
                'status' => 'active',
                'hospital_id' => null,
            ]
        );

        User::updateOrCreate(
            ['email' => 'doctor3@medsi.vn'],
            [
                'name' => 'PGS.TS Lê Hoàng Nam',
                'password' => Hash::make('Doctor@123456'),
                'phone' => '0902000003',
                'role' => 'doctor',
                'status' => 'active',
                'hospital_id' => null,
            ]
        );

        // 3. Ba Bệnh nhân mẫu
        User::updateOrCreate(
            ['email' => 'patient1@medsi.vn'],
            [
                'name' => 'Phạm Minh Tuấn',
                'password' => Hash::make('Patient@123456'),
                'phone' => '0903000001',
                'role' => 'patient',
                'status' => 'active',
                'hospital_id' => null,
            ]
        );

        User::updateOrCreate(
            ['email' => 'patient2@medsi.vn'],
            [
                'name' => 'Lê Thanh Thảo',
                'password' => Hash::make('Patient@123456'),
                'phone' => '0903000002',
                'role' => 'patient',
                'status' => 'active',
                'hospital_id' => null,
            ]
        );

        User::updateOrCreate(
            ['email' => 'patient3@medsi.vn'],
            [
                'name' => 'Hoàng Đức Huy',
                'password' => Hash::make('Patient@123456'),
                'phone' => '0903000003',
                'role' => 'patient',
                'status' => 'active',
                'hospital_id' => null,
            ]
        );

        // 4. Nhân viên cơ sở y tế (Staff - gắn hospital_id phục vụ check-in E01/E09)
        User::updateOrCreate(
            ['email' => 'staff.choray@medsi.vn'],
            [
                'name' => 'Tiếp Đón BV Chợ Rẫy',
                'password' => Hash::make('Staff@123456'),
                'phone' => '0904000001',
                'role' => 'staff',
                'status' => 'active',
                'hospital_id' => $choRayId,
            ]
        );

        User::updateOrCreate(
            ['email' => 'staff.bachmai@medsi.vn'],
            [
                'name' => 'Tiếp Đón BV Bạch Mai',
                'password' => Hash::make('Staff@123456'),
                'phone' => '0904000002',
                'role' => 'staff',
                'status' => 'active',
                'hospital_id' => $bachMaiId,
            ]
        );
    }
}

