<?php

namespace Database\Seeders;

use App\Models\Doctor;
use App\Models\Hospital;
use App\Models\Slot;
use App\Models\Specialty;
use Carbon\CarbonImmutable;
use Illuminate\Database\Seeder;

class SlotSeeder extends Seeder
{
    public function run(): void
    {
        $today = CarbonImmutable::now('Asia/Ho_Chi_Minh')->startOfDay();
        $specialtyCardio = Specialty::where('code', 'CK03')->first();
        $doctor1 = Doctor::find(1); // BS An (Tim mạch - Chợ Rẫy)
        $hospitalChoRay = Hospital::find(1);

        if (! $specialtyCardio || ! $doctor1 || ! $hospitalChoRay) {
            return;
        }

        $slots = [];

        // -------------------------------------------------------------
        // 1. Slot ĐÃ QUA trong quá khứ (past) phục vụ kiểm thử E12 (quá giờ bắt đầu 15p)
        // -------------------------------------------------------------
        $slots[] = [
            'owner_type' => 'doctor',
            'owner_id' => $doctor1->id,
            'specialty_id' => $specialtyCardio->id,
            'work_date' => $today->subDays(1)->toDateString(),
            'start_time' => '08:00:00',
            'end_time' => '08:30:00',
            'capacity' => 1,
            'booked_count' => 1,
            'status' => 'full',
        ];

        // -------------------------------------------------------------
        // 2. Slot HÔM NAY - Bị quá giờ 15 phút (cho test E12 no-show hôm nay)
        // -------------------------------------------------------------
        $slots[] = [
            'owner_type' => 'doctor',
            'owner_id' => $doctor1->id,
            'specialty_id' => $specialtyCardio->id,
            'work_date' => $today->toDateString(),
            'start_time' => '07:00:00',
            'end_time' => '07:30:00',
            'capacity' => 1,
            'booked_count' => 1,
            'status' => 'full',
        ];

        // -------------------------------------------------------------
        // 3. Slot NGÀY MAI (Day + 1):
        //    - 1 slot CÒN ĐÚNG 1 CHỖ (capacity=1, booked_count=0) phục vụ E13 Concurrency Test!
        //    - 1 slot CÒN 1 CHỖ trong ca 3 chỗ (capacity=3, booked_count=2)
        //    - 1 slot ĐÃ ĐẦY (capacity=1, booked_count=1, status=full)
        //    - 1 slot BỊ KHÓA (status=blocked)
        // -------------------------------------------------------------
        $tomorrow = $today->addDays(1);

        // Slot phục vụ E13: capacity 1, booked_count 0
        $slots[] = [
            'owner_type' => 'doctor',
            'owner_id' => $doctor1->id,
            'specialty_id' => $specialtyCardio->id,
            'work_date' => $tomorrow->toDateString(),
            'start_time' => '08:00:00',
            'end_time' => '08:30:00',
            'capacity' => 1,
            'booked_count' => 0,
            'status' => 'available',
        ];

        // Slot còn 1 chỗ trên tổng 3 chỗ
        $slots[] = [
            'owner_type' => 'doctor',
            'owner_id' => $doctor1->id,
            'specialty_id' => $specialtyCardio->id,
            'work_date' => $tomorrow->toDateString(),
            'start_time' => '08:30:00',
            'end_time' => '09:00:00',
            'capacity' => 3,
            'booked_count' => 2,
            'status' => 'available',
        ];

        // Slot ĐẦY
        $slots[] = [
            'owner_type' => 'doctor',
            'owner_id' => $doctor1->id,
            'specialty_id' => $specialtyCardio->id,
            'work_date' => $tomorrow->toDateString(),
            'start_time' => '09:00:00',
            'end_time' => '09:30:00',
            'capacity' => 1,
            'booked_count' => 1,
            'status' => 'full',
        ];

        // Slot BỊ KHÓA (Blocked)
        $slots[] = [
            'owner_type' => 'doctor',
            'owner_id' => $doctor1->id,
            'specialty_id' => $specialtyCardio->id,
            'work_date' => $tomorrow->toDateString(),
            'start_time' => '09:30:00',
            'end_time' => '10:00:00',
            'capacity' => 1,
            'booked_count' => 0,
            'status' => 'blocked',
        ];

        // Slot còn nhiều chỗ (capacity 5, booked 1)
        $slots[] = [
            'owner_type' => 'doctor',
            'owner_id' => $doctor1->id,
            'specialty_id' => $specialtyCardio->id,
            'work_date' => $tomorrow->toDateString(),
            'start_time' => '10:00:00',
            'end_time' => '10:30:00',
            'capacity' => 5,
            'booked_count' => 1,
            'status' => 'available',
        ];

        // -------------------------------------------------------------
        // 4. Slots BỆNH VIỆN (Hospital Slots - Ca sáng / Ca chiều)
        // -------------------------------------------------------------
        // Ca sáng Chợ Rẫy (Tim mạch CK03)
        $slots[] = [
            'owner_type' => 'hospital',
            'owner_id' => $hospitalChoRay->id,
            'specialty_id' => $specialtyCardio->id,
            'work_date' => $tomorrow->toDateString(),
            'start_time' => '07:30:00',
            'end_time' => '11:30:00',
            'capacity' => 50,
            'booked_count' => 12,
            'status' => 'available',
        ];

        // Ca chiều Chợ Rẫy (Tim mạch CK03)
        $slots[] = [
            'owner_type' => 'hospital',
            'owner_id' => $hospitalChoRay->id,
            'specialty_id' => $specialtyCardio->id,
            'work_date' => $tomorrow->toDateString(),
            'start_time' => '13:00:00',
            'end_time' => '16:30:00',
            'capacity' => 40,
            'booked_count' => 5,
            'status' => 'available',
        ];

        // -------------------------------------------------------------
        // 5. Rải đều Slots cho 7 ngày tới (từ Day + 2 đến Day + 7)
        // -------------------------------------------------------------
        for ($i = 2; $i <= 7; $i++) {
            $day = $today->addDays($i);

            // Bác sĩ 1 (Tim mạch)
            $slots[] = [
                'owner_type' => 'doctor',
                'owner_id' => $doctor1->id,
                'specialty_id' => $specialtyCardio->id,
                'work_date' => $day->toDateString(),
                'start_time' => '08:00:00',
                'end_time' => '08:30:00',
                'capacity' => 1,
                'booked_count' => 0,
                'status' => 'available',
            ];
            $slots[] = [
                'owner_type' => 'doctor',
                'owner_id' => $doctor1->id,
                'specialty_id' => $specialtyCardio->id,
                'work_date' => $day->toDateString(),
                'start_time' => '08:30:00',
                'end_time' => '09:00:00',
                'capacity' => 1,
                'booked_count' => 0,
                'status' => 'available',
            ];

            // Bệnh viện Chợ Rẫy
            $slots[] = [
                'owner_type' => 'hospital',
                'owner_id' => $hospitalChoRay->id,
                'specialty_id' => $specialtyCardio->id,
                'work_date' => $day->toDateString(),
                'start_time' => '07:30:00',
                'end_time' => '11:30:00',
                'capacity' => 50,
                'booked_count' => rand(0, 10),
                'status' => 'available',
            ];
        }

        foreach ($slots as $item) {
            Slot::updateOrCreate(
                [
                    'owner_type' => $item['owner_type'],
                    'owner_id' => $item['owner_id'],
                    'specialty_id' => $item['specialty_id'],
                    'work_date' => $item['work_date'],
                    'start_time' => $item['start_time'],
                ],
                $item
            );
        }
    }
}

