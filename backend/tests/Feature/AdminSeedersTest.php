<?php

namespace Tests\Feature;

use App\Models\Doctor;
use App\Models\ExamType;
use App\Models\Hospital;
use App\Models\Slot;
use App\Models\Specialty;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Tests\TestCase;

class AdminSeedersTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        config(['database.default' => 'sqlite']);
        config(['database.connections.sqlite.database' => database_path('database.sqlite')]);
    }

    public function test_seeders_populate_all_required_baseline_data(): void
    {
        $this->artisan('migrate:fresh --database=sqlite --force');
        $this->seed(DatabaseSeeder::class);

        // 1. Kiểm tra 14 Chuyên khoa & CK03 là Tim mạch
        $this->assertEquals(14, Specialty::count());
        $ck03 = Specialty::where('code', 'CK03')->first();
        $this->assertNotNull($ck03);
        $this->assertEquals('Tim mạch', $ck03->name);

        // 2. Kiểm tra 6 Bệnh viện ở 2 khu vực tỉnh/thành có tọa độ
        $this->assertEquals(6, Hospital::count());
        $hcmHospitals = Hospital::where('city', 'Hồ Chí Minh')->count();
        $hnHospitals = Hospital::where('city', 'Hà Nội')->count();
        $this->assertEquals(3, $hcmHospitals);
        $this->assertEquals(3, $hnHospitals);

        foreach (Hospital::all() as $hospital) {
            $this->assertNotNull($hospital->latitude);
            $this->assertNotNull($hospital->longitude);
        }

        // 3. Kiểm tra 18 Bác sĩ & chi phí khám từ 150.000 đến 500.000
        $this->assertEquals(18, Doctor::count());
        $minFee = Doctor::min('consultation_fee');
        $maxFee = Doctor::max('consultation_fee');
        $this->assertGreaterThanOrEqual(150000, $minFee);
        $this->assertLessThanOrEqual(500000, $maxFee);

        // Mỗi chuyên khoa có ít nhất 1 bác sĩ
        foreach (Specialty::all() as $spec) {
            $count = Doctor::where('specialty_id', $spec->id)->count();
            $this->assertGreaterThanOrEqual(1, $count, "Chuyên khoa {$spec->name} chưa có bác sĩ.");
        }

        // 4. Kiểm tra Users mẫu: 1 admin, 3 bác sĩ, 3 bệnh nhân, staff
        $this->assertEquals(1, User::where('role', 'admin')->count());
        $this->assertGreaterThanOrEqual(3, User::where('role', 'doctor')->count());
        $this->assertEquals(3, User::where('role', 'patient')->count());
        $this->assertGreaterThanOrEqual(1, User::where('role', 'staff')->count());

        // Bác sĩ có liên kết user_id hợp lệ
        $doctorWithUser = Doctor::whereNotNull('user_id')->count();
        $this->assertEquals(3, $doctorWithUser);

        // 5. Kiểm tra Slots trong 7 ngày tới có đủ các trạng thái
        $this->assertGreaterThan(0, Slot::count());
        $this->assertTrue(Slot::where('status', 'available')->exists());
        $this->assertTrue(Slot::where('status', 'full')->exists());
        $this->assertTrue(Slot::where('status', 'blocked')->exists());

        // Slot phục vụ kịch bản E13 (còn đúng 1 chỗ: capacity=1, booked_count=0)
        $slotE13 = Slot::where('capacity', 1)->where('booked_count', 0)->where('status', 'available')->first();
        $this->assertNotNull($slotE13, 'Không tìm thấy slot phục vụ test race condition E13.');

        // 6. Kiểm tra ExamTypes
        $this->assertGreaterThanOrEqual(6, ExamType::count());
    }
}
