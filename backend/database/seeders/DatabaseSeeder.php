<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            SpecialtySeeder::class, // 14 chuyên khoa chuẩn (CK03 = Tim mạch)
            HospitalSeeder::class,  // 6 bệnh viện (2 khu vực, có toạ độ GPS)
            UserSeeder::class,      // 1 admin, 3 bác sĩ, 3 bệnh nhân, staff
            DoctorSeeder::class,    // 18 bác sĩ phủ 14 chuyên khoa
            ExamTypeSeeder::class,  // Các gói loại khám y tế
            SlotSeeder::class,      // Slots 7 ngày tới (đầy đủ 5 trạng thái)
        ]);
    }
}
