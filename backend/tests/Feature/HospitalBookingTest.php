<?php

namespace Tests\Feature;

use App\Exceptions\Booking\BookingAlreadyExistsException;
use App\Exceptions\Booking\ExamTypeMismatchException;
use App\Exceptions\Booking\InvalidSlotException;
use App\Exceptions\Booking\PatientProfileNotFoundException;
use App\Exceptions\Booking\SlotUnavailableException;
use App\Exceptions\Hospital\HospitalNotFoundException;
use App\Models\Booking;
use App\Models\Doctor;
use App\Models\ExamType;
use App\Models\Hospital;
use App\Models\PatientProfile;
use App\Models\Slot;
use App\Models\User;
use App\Services\BookingService;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class HospitalBookingTest extends TestCase
{
    use RefreshDatabase;

    private BookingService $bookingService;
    private User $user;
    private PatientProfile $patientProfile;
    private Hospital $hospital;
    private ExamType $examType;
    private Slot $slot;

    protected function setUp(): void
    {
        parent::setUp();
        $this->bookingService = new BookingService();

        // Khởi tạo người dùng và hồ sơ bệnh nhân qua Factory
        $this->user = User::factory()->create();
        $this->patientProfile = PatientProfile::factory()->create([
            'user_id' => $this->user->id,
            'full_name' => 'Nguyễn Văn Bệnh Nhân',
            'phone' => '0901234567',
        ]);

        // Khởi tạo cơ sở y tế và loại hình dịch vụ khám qua Factory
        $this->hospital = Hospital::factory()->create([
            'name' => 'Bệnh viện Đa khoa MedSi',
            'address' => '123 Đường Y Dược, Quận 1',
            'city' => 'Hồ Chí Minh',
            'hotline' => '028999999',
        ]);

        $this->examType = ExamType::factory()->for($this->hospital)->create([
            'name' => 'Gói khám tim mạch chuyên sâu',
            'price' => 750000,
        ]);

        // Khởi tạo khung giờ khám của bệnh viện qua Factory
        $this->slot = Slot::factory()->forHospital($this->hospital, 5)->create([
            'work_date' => now()->addDay()->toDateString(),
            'start_time' => '09:00:00',
            'end_time' => '10:00:00',
            'capacity' => 5,
            'booked_count' => 0,
            'status' => 'available',
        ]);
    }

    public function test_create_hospital_booking_successfully(): void
    {
        $data = [
            'patient_profile_id' => $this->patientProfile->id,
            'hospital_id' => $this->hospital->id,
            'exam_type_id' => $this->examType->id,
            'slot_id' => $this->slot->id,
            'symptoms' => 'Đau thắt ngực khi vận động mạnh',
            'note' => 'Yêu cầu bác sĩ nói tiếng Anh nếu có',
            'hold_minutes' => 15,
            'payment_method' => 'qr_pay',
        ];

        $booking = $this->bookingService->createHospitalBooking($this->user->id, $data);

        $this->assertInstanceOf(Booking::class, $booking);
        $this->assertDatabaseHas('bookings', [
            'id' => $booking->id,
            'user_id' => $this->user->id,
            'patient_profile_id' => $this->patientProfile->id,
            'booking_type' => 'hospital',
            'hospital_id' => $this->hospital->id,
            'exam_type_id' => $this->examType->id,
            'slot_id' => $this->slot->id,
            'status' => 'pending_payment',
        ]);

        // Kiểm tra mã booking tự động sinh
        $this->assertNotNull($booking->code);
        $this->assertStringStartsWith('BK'.now()->format('Ymd'), $booking->code);

        // Bác sĩ phải là NULL cho hospital booking
        $this->assertNull($booking->doctor_id);

        // Kiểm tra thời hạn giữ chỗ
        $this->assertNotNull($booking->slot_hold_expires_at);
        $this->assertTrue($booking->slot_hold_expires_at->isFuture());

        // Kiểm tra tải slot tăng
        $freshSlot = $this->slot->fresh();
        $this->assertEquals(1, $freshSlot->booked_count);
        $this->assertEquals('available', $freshSlot->status);

        // Kiểm tra bản ghi Payment
        $this->assertDatabaseHas('payments', [
            'booking_id' => $booking->id,
            'method' => 'qr_pay',
            'exam_fee' => 750000.00,
            'total_amount' => 750000.00,
            'status' => 'pending',
        ]);
    }

    public function test_slot_status_changes_to_full_when_capacity_reached(): void
    {
        $singleSlot = Slot::factory()->forHospital($this->hospital, 1)->create([
            'work_date' => now()->addDay()->toDateString(),
            'start_time' => '14:00:00',
            'end_time' => '15:00:00',
            'capacity' => 1,
            'booked_count' => 0,
            'status' => 'available',
        ]);

        $data = [
            'patient_profile_id' => $this->patientProfile->id,
            'hospital_id' => $this->hospital->id,
            'exam_type_id' => $this->examType->id,
            'slot_id' => $singleSlot->id,
        ];

        $booking = $this->bookingService->createHospitalBooking($this->user->id, $data);

        $this->assertNotNull($booking);
        $freshSlot = $singleSlot->fresh();
        $this->assertEquals(1, $freshSlot->booked_count);
        $this->assertEquals('full', $freshSlot->status);
    }

    public function test_throws_slot_unavailable_exception_when_slot_is_full(): void
    {
        $this->slot->update([
            'capacity' => 2,
            'booked_count' => 2,
            'status' => 'full',
        ]);

        $data = [
            'patient_profile_id' => $this->patientProfile->id,
            'hospital_id' => $this->hospital->id,
            'exam_type_id' => $this->examType->id,
            'slot_id' => $this->slot->id,
        ];

        $this->expectException(SlotUnavailableException::class);
        $this->bookingService->createHospitalBooking($this->user->id, $data);
    }

    public function test_throws_slot_unavailable_exception_when_slot_is_blocked(): void
    {
        $this->slot->update(['status' => 'blocked']);

        $data = [
            'patient_profile_id' => $this->patientProfile->id,
            'hospital_id' => $this->hospital->id,
            'exam_type_id' => $this->examType->id,
            'slot_id' => $this->slot->id,
        ];

        $this->expectException(SlotUnavailableException::class);
        $this->bookingService->createHospitalBooking($this->user->id, $data);
    }

    public function test_throws_slot_unavailable_exception_when_work_date_in_past(): void
    {
        $this->slot->update(['work_date' => now()->subDay()->toDateString()]);

        $data = [
            'patient_profile_id' => $this->patientProfile->id,
            'hospital_id' => $this->hospital->id,
            'exam_type_id' => $this->examType->id,
            'slot_id' => $this->slot->id,
        ];

        $this->expectException(SlotUnavailableException::class);
        $this->bookingService->createHospitalBooking($this->user->id, $data);
    }

    public function test_throws_booking_already_exists_exception_when_duplicate_booking(): void
    {
        $data = [
            'patient_profile_id' => $this->patientProfile->id,
            'hospital_id' => $this->hospital->id,
            'exam_type_id' => $this->examType->id,
            'slot_id' => $this->slot->id,
        ];

        // Lần 1: Thành công
        $this->bookingService->createHospitalBooking($this->user->id, $data);

        // Lần 2: Cùng bệnh nhân đặt lại slot này khi đang active -> ném lỗi 409
        $this->expectException(BookingAlreadyExistsException::class);
        $this->bookingService->createHospitalBooking($this->user->id, $data);
    }

    public function test_patient_can_rebook_slot_if_previous_booking_was_cancelled(): void
    {
        // 1. Tạo trước 1 booking có trạng thái cancelled cho bệnh nhân A trên slot X bằng Factory
        $cancelledBooking = Booking::factory()->cancelled()->create([
            'user_id' => $this->user->id,
            'patient_profile_id' => $this->patientProfile->id,
            'booking_type' => 'hospital',
            'doctor_id' => null,
            'hospital_id' => $this->hospital->id,
            'exam_type_id' => $this->examType->id,
            'slot_id' => $this->slot->id,
        ]);

        $data = [
            'patient_profile_id' => $this->patientProfile->id,
            'hospital_id' => $this->hospital->id,
            'exam_type_id' => $this->examType->id,
            'slot_id' => $this->slot->id,
            'symptoms' => 'Đặt lại sau khi hủy lịch hẹn trước',
        ];

        // 2. Gọi createHospitalBooking() cho bệnh nhân A trên đúng slot X
        $newBooking = $this->bookingService->createHospitalBooking($this->user->id, $data);

        // 3. Khẳng định đặt lại thành công:
        // - Trả về booking mới với status pending_payment
        $this->assertInstanceOf(Booking::class, $newBooking);
        $this->assertEquals('pending_payment', $newBooking->status);
        $this->assertNotEquals($cancelledBooking->id, $newBooking->id);

        // - DB có 2 bản ghi cho hồ sơ bệnh nhân trên slot này (1 cancelled, 1 pending_payment)
        $bookingsInDb = Booking::where('patient_profile_id', $this->patientProfile->id)
            ->where('slot_id', $this->slot->id)
            ->get();

        $this->assertCount(2, $bookingsInDb);
        $this->assertTrue($bookingsInDb->contains('id', $cancelledBooking->id));
        $this->assertTrue($bookingsInDb->contains('id', $newBooking->id));
        $this->assertEquals('cancelled', $bookingsInDb->firstWhere('id', $cancelledBooking->id)->status);
        $this->assertEquals('pending_payment', $bookingsInDb->firstWhere('id', $newBooking->id)->status);
    }

    public function test_patient_can_rebook_slot_if_previous_booking_was_rejected(): void
    {
        // 1. Tạo trước 1 booking có trạng thái rejected cho bệnh nhân A trên slot X
        $rejectedBooking = Booking::factory()->create([
            'user_id' => $this->user->id,
            'patient_profile_id' => $this->patientProfile->id,
            'booking_type' => 'hospital',
            'doctor_id' => null,
            'hospital_id' => $this->hospital->id,
            'exam_type_id' => $this->examType->id,
            'slot_id' => $this->slot->id,
            'status' => 'rejected',
        ]);

        $data = [
            'patient_profile_id' => $this->patientProfile->id,
            'hospital_id' => $this->hospital->id,
            'exam_type_id' => $this->examType->id,
            'slot_id' => $this->slot->id,
            'symptoms' => 'Đặt lại sau khi lịch hẹn trước bị từ chối',
        ];

        // 2. Đặt lại thành công
        $newBooking = $this->bookingService->createHospitalBooking($this->user->id, $data);

        $this->assertInstanceOf(Booking::class, $newBooking);
        $this->assertEquals('pending_payment', $newBooking->status);
        $this->assertNotEquals($rejectedBooking->id, $newBooking->id);
    }

    public function test_throws_invalid_slot_exception_when_slot_belongs_to_another_hospital(): void
    {
        $otherHospital = Hospital::factory()->create();
        $otherSlot = Slot::factory()->forHospital($otherHospital)->create([
            'work_date' => now()->addDay()->toDateString(),
        ]);

        $data = [
            'patient_profile_id' => $this->patientProfile->id,
            'hospital_id' => $this->hospital->id, // Bệnh viện 1
            'exam_type_id' => $this->examType->id,
            'slot_id' => $otherSlot->id, // Slot thuộc Bệnh viện 2
        ];

        $this->expectException(InvalidSlotException::class);
        $this->bookingService->createHospitalBooking($this->user->id, $data);
    }

    public function test_throws_invalid_slot_exception_when_slot_owner_type_is_doctor(): void
    {
        $doctor = Doctor::factory()->create();
        $doctorSlot = Slot::factory()->forDoctor($doctor)->create([
            'work_date' => now()->addDay()->toDateString(),
        ]);

        $data = [
            'patient_profile_id' => $this->patientProfile->id,
            'hospital_id' => $this->hospital->id,
            'exam_type_id' => $this->examType->id,
            'slot_id' => $doctorSlot->id,
        ];

        $this->expectException(InvalidSlotException::class);
        $this->bookingService->createHospitalBooking($this->user->id, $data);
    }

    public function test_throws_exam_type_mismatch_exception_when_exam_type_not_in_hospital(): void
    {
        $otherHospital = Hospital::factory()->create();
        $otherExamType = ExamType::factory()->for($otherHospital)->create();

        $data = [
            'patient_profile_id' => $this->patientProfile->id,
            'hospital_id' => $this->hospital->id, // Bệnh viện hiện tại
            'exam_type_id' => $otherExamType->id, // Dịch vụ của bệnh viện khác
            'slot_id' => $this->slot->id,
        ];

        $this->expectException(ExamTypeMismatchException::class);
        $this->bookingService->createHospitalBooking($this->user->id, $data);
    }

    public function test_throws_patient_profile_not_found_when_profile_does_not_belong_to_user(): void
    {
        $otherUser = User::factory()->create();
        $otherProfile = PatientProfile::factory()->create([
            'user_id' => $otherUser->id,
        ]);

        $data = [
            'patient_profile_id' => $otherProfile->id,
            'hospital_id' => $this->hospital->id,
            'exam_type_id' => $this->examType->id,
            'slot_id' => $this->slot->id,
        ];

        $this->expectException(PatientProfileNotFoundException::class);
        $this->bookingService->createHospitalBooking($this->user->id, $data);
    }

    public function test_throws_hospital_not_found_exception_when_hospital_does_not_exist(): void
    {
        $data = [
            'patient_profile_id' => $this->patientProfile->id,
            'hospital_id' => 999999,
            'exam_type_id' => $this->examType->id,
            'slot_id' => $this->slot->id,
        ];

        $this->expectException(HospitalNotFoundException::class);
        $this->bookingService->createHospitalBooking($this->user->id, $data);
    }

    public function test_concurrency_pessimistic_locking_prevents_overbooking(): void
    {
        // Trong môi trường test có RefreshDatabase, commit transaction hiện tại của connection chính
        // để connection phụ (mysql_concurrency) có thể nhìn thấy dữ liệu slot đã tạo.
        while (DB::transactionLevel() > 0) {
            DB::commit();
        }

        config(['database.connections.mysql_concurrency' => config('database.connections.mysql')]);
        $conn1 = DB::connection('mysql');
        $conn2 = DB::connection('mysql_concurrency');

        // Tạo slot có đúng capacity = 1
        $singleSlot = Slot::factory()->forHospital($this->hospital, 1)->create([
            'work_date' => now()->addDay()->toDateString(),
            'start_time' => '16:00:00',
            'end_time' => '17:00:00',
            'capacity' => 1,
            'booked_count' => 0,
            'status' => 'available',
        ]);

        $secondUser = User::factory()->create();
        $secondProfile = PatientProfile::factory()->create([
            'user_id' => $secondUser->id,
            'full_name' => 'Bệnh nhân thứ hai',
        ]);

        $data1 = [
            'patient_profile_id' => $this->patientProfile->id,
            'hospital_id' => $this->hospital->id,
            'exam_type_id' => $this->examType->id,
            'slot_id' => $singleSlot->id,
        ];

        $data2 = [
            'patient_profile_id' => $secondProfile->id,
            'hospital_id' => $this->hospital->id,
            'exam_type_id' => $this->examType->id,
            'slot_id' => $singleSlot->id,
        ];

        try {
            // Bước 1: Mô phỏng Transaction 1 mở ra gọi Slot::lockForUpdate() trên slot còn đúng 1 chỗ nhưng chưa commit
            $conn2->beginTransaction();
            $lockedSlot = Slot::on('mysql_concurrency')
                ->where('id', $singleSlot->id)
                ->lockForUpdate()
                ->first();

            $this->assertNotNull($lockedSlot);

            // Cấu hình innodb_lock_wait_timeout = 1 giây cho connection 1 để test thời gian chờ khóa
            $conn1->statement('SET SESSION innodb_lock_wait_timeout = 1');

            // Bước 2: Khi Transaction 2 của createHospitalBooking() cố gắng truy cập slot đang bị giữ khóa độc quyền
            $wasBlockedByLock = false;
            try {
                $this->bookingService->createHospitalBooking($this->user->id, $data1);
            } catch (QueryException $e) {
                // Transaction 2 bị chặn hợp lệ bởi khóa bi quan (Lock wait timeout exceeded: MySQL 1205)
                if (str_contains($e->getMessage(), '1205')) {
                    $wasBlockedByLock = true;
                } else {
                    throw $e;
                }
            }

            $this->assertTrue($wasBlockedByLock, 'Transaction 2 phải bị chặn bởi lockForUpdate của Transaction 1');

            // Bước 3: Transaction 1 hoàn tất đặt chỗ (đạt capacity) và commit
            $lockedSlot->increment('booked_count');
            $lockedSlot->update(['status' => 'full']);
            $conn2->commit();

            // Khôi phục innodb_lock_wait_timeout về giá trị mặc định
            $conn1->statement('SET SESSION innodb_lock_wait_timeout = 50');

            // Bước 4: Transaction 2 tiếp tục thực hiện sau khi Transaction 1 đã commit -> Bị ném SlotUnavailableException
            $threwSlotUnavailable = false;
            try {
                $this->bookingService->createHospitalBooking($secondUser->id, $data2);
            } catch (SlotUnavailableException $e) {
                $threwSlotUnavailable = true;
            }

            $this->assertTrue($threwSlotUnavailable, 'Transaction đến sau phải bị từ chối với SlotUnavailableException khi slot đã hết chỗ');

            // Bước 5: Khẳng định slot không bao giờ bị overbooking (booked_count không vượt quá capacity)
            $freshSlot = $singleSlot->fresh();
            $this->assertEquals(1, $freshSlot->booked_count);
            $this->assertEquals('full', $freshSlot->status);
            $this->assertLessThanOrEqual($freshSlot->capacity, $freshSlot->booked_count);
        } finally {
            if ($conn2->transactionLevel() > 0) {
                $conn2->rollBack();
            }
            $conn1->statement('SET SESSION innodb_lock_wait_timeout = 50');
            $singleSlot->delete();
            $secondProfile->delete();
            $secondUser->delete();
        }
    }
}
