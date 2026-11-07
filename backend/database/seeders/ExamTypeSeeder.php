<?php

namespace Database\Seeders;

use App\Models\ExamType;
use App\Models\Hospital;
use App\Models\Specialty;
use Illuminate\Database\Seeder;

class ExamTypeSeeder extends Seeder
{
    public function run(): void
    {
        $specialties = Specialty::all()->keyBy('code');
        $hospitals = Hospital::all()->keyBy('id');

        $examTypes = [
            // Bệnh viện Chợ Rẫy (ID 1)
            [
                'hospital_id' => 1,
                'specialty_id' => $specialties['CK03']->id, // Tim mạch
                'name' => 'Khám Tim mạch chuyên gia',
                'price' => 200000,
            ],
            [
                'hospital_id' => 1,
                'specialty_id' => $specialties['CK02']->id, // Nội
                'name' => 'Khám Nội tổng quát chất lượng cao',
                'price' => 180000,
            ],

            // Bệnh viện ĐHYD TP.HCM (ID 2)
            [
                'hospital_id' => 2,
                'specialty_id' => $specialties['CK03']->id, // Tim mạch
                'name' => 'Khám chuyên khoa Tim mạch theo yêu cầu',
                'price' => 250000,
            ],
            [
                'hospital_id' => 2,
                'specialty_id' => $specialties['CK04']->id, // Sản phụ khoa
                'name' => 'Khám và tư vấn Tiền sản dịch vụ',
                'price' => 220000,
            ],
            [
                'hospital_id' => 2,
                'specialty_id' => $specialties['CK08']->id, // Da liễu
                'name' => 'Khám Da liễu thẩm mỹ kỹ thuật cao',
                'price' => 200000,
            ],

            // Bệnh viện Nhân dân Gia Định (ID 3)
            [
                'hospital_id' => 3,
                'specialty_id' => $specialties['CK01']->id, // Nhi khoa
                'name' => 'Khám Nhi khoa theo hẹn giờ ưu tiên',
                'price' => 150000,
            ],

            // Bệnh viện Bạch Mai (ID 4)
            [
                'hospital_id' => 4,
                'specialty_id' => $specialties['CK03']->id, // Tim mạch (Viện Tim Mạch)
                'name' => 'Khám Tim mạch Viện Tim mạch Quốc gia',
                'price' => 200000,
            ],
            [
                'hospital_id' => 4,
                'specialty_id' => $specialties['CK10']->id, // Tiêu hóa
                'name' => 'Khám Tiêu hóa gan mật theo yêu cầu',
                'price' => 200000,
            ],
            [
                'hospital_id' => 4,
                'specialty_id' => $specialties['CK11']->id, // Thần kinh
                'name' => 'Khám chuyên khoa Thần kinh chất lượng cao',
                'price' => 220000,
            ],

            // Bệnh viện Việt Đức (ID 5)
            [
                'hospital_id' => 5,
                'specialty_id' => $specialties['CK09']->id, // Cơ Xương Khớp
                'name' => 'Khám Chấn thương Chỉnh hình & Cột sống',
                'price' => 250000,
            ],
            [
                'hospital_id' => 5,
                'specialty_id' => $specialties['CK13']->id, // Ngoại
                'name' => 'Khám Ngoại khoa chuyên gia phẫu thuật',
                'price' => 200000,
            ],

            // Bệnh viện Đa khoa Xanh Pôn (ID 6)
            [
                'hospital_id' => 6,
                'specialty_id' => $specialties['CK01']->id, // Nhi khoa
                'name' => 'Khám Nhi khoa tổng quát kỹ thuật cao',
                'price' => 180000,
            ],
        ];

        foreach ($examTypes as $item) {
            ExamType::updateOrCreate(
                [
                    'hospital_id' => $item['hospital_id'],
                    'specialty_id' => $item['specialty_id'],
                    'name' => $item['name'],
                ],
                $item
            );
        }
    }
}

