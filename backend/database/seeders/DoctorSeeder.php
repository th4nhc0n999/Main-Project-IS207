<?php

namespace Database\Seeders;

use App\Models\Doctor;
use App\Models\Hospital;
use App\Models\Specialty;
use App\Models\User;
use Illuminate\Database\Seeder;

class DoctorSeeder extends Seeder
{
    public function run(): void
    {
        $specialties = Specialty::all()->keyBy('code');
        $hospitals = Hospital::all()->keyBy('id');

        $userDoc1 = User::where('email', 'doctor1@medsi.vn')->first();
        $userDoc2 = User::where('email', 'doctor2@medsi.vn')->first();
        $userDoc3 = User::where('email', 'doctor3@medsi.vn')->first();

        // Danh sách 18 bác sĩ (mỗi chuyên khoa ít nhất 1 bác sĩ, phí 150.000đ - 500.000đ)
        $doctors = [
            // 3 bác sĩ có tài khoản User liên kết
            [
                'id' => 1,
                'user_id' => $userDoc1 ? $userDoc1->id : null,
                'specialty_id' => $specialties['CK03']->id, // Tim mạch
                'hospital_id' => 1, // BV Chợ Rẫy
                'name' => 'BS.CKII Nguyễn Văn An',
                'title' => 'Bác sĩ Chuyên khoa II',
                'years_experience' => 18,
                'bio' => 'Chuyên gia can thiệp tim mạch, suy tim mạn tính và tăng huyết áp kháng trị.',
                'city' => 'Hồ Chí Minh',
                'address' => '201B Nguyễn Chí Thanh, Quận 5',
                'latitude' => 10.7578234,
                'longitude' => 106.6593452,
                'consultation_fee' => 350000,
                'avatar' => 'doctors/nguyen-van-an.png',
            ],
            [
                'id' => 2,
                'user_id' => $userDoc2 ? $userDoc2->id : null,
                'specialty_id' => $specialties['CK01']->id, // Nhi khoa
                'hospital_id' => 3, // BV Nhi Đồng 1
                'name' => 'ThS.BS Trần Thị Mai',
                'title' => 'Thạc sĩ Bác sĩ',
                'years_experience' => 12,
                'bio' => 'Chuyên khoa Nhi sơ sinh, bệnh lý đường hô hấp và dinh dưỡng trẻ nhỏ.',
                'city' => 'Hồ Chí Minh',
                'address' => '341 Sư Vạn Hạnh, Quận 10',
                'latitude' => 10.7712345,
                'longitude' => 106.6705678,
                'consultation_fee' => 250000,
                'avatar' => 'doctors/tran-thi-mai.png',
            ],
            [
                'id' => 3,
                'user_id' => $userDoc3 ? $userDoc3->id : null,
                'specialty_id' => $specialties['CK03']->id, // Tim mạch (Hà Nội)
                'hospital_id' => 4, // BV Bạch Mai
                'name' => 'PGS.TS Lê Hoàng Nam',
                'title' => 'Phó Giáo sư, Tiến sĩ',
                'years_experience' => 25,
                'bio' => 'Nguyên Trưởng khoa Tim mạch can thiệp, chuyên sâu loạn nhịp tim và bệnh mạch vành.',
                'city' => 'Hà Nội',
                'address' => '78 Giải Phóng, Đống Đa',
                'latitude' => 20.9997890,
                'longitude' => 105.8412340,
                'consultation_fee' => 500000,
                'avatar' => 'doctors/le-hoang-nam.png',
            ],

            // 15 bác sĩ còn lại (đảm bảo phủ kín 14 chuyên khoa)
            [
                'id' => 4,
                'user_id' => null,
                'specialty_id' => $specialties['CK02']->id, // Nội tổng quát
                'hospital_id' => 1,
                'name' => 'BS.CKI Phạm Quốc Bảo',
                'title' => 'Bác sĩ Chuyên khoa I',
                'years_experience' => 10,
                'bio' => 'Điều trị các bệnh đái tháo đường, rối loạn lipid máu và nội tiết.',
                'city' => 'Hồ Chí Minh',
                'address' => 'Quận 5, TP.HCM',
                'latitude' => 10.7580000,
                'longitude' => 106.6600000,
                'consultation_fee' => 200000,
                'avatar' => 'doctors/pham-quoc-bao.png',
            ],
            [
                'id' => 5,
                'user_id' => null,
                'specialty_id' => $specialties['CK04']->id, // Sản phụ khoa
                'hospital_id' => 2,
                'name' => 'ThS.BS Vũ Bích Ngọc',
                'title' => 'Thạc sĩ Bác sĩ',
                'years_experience' => 14,
                'bio' => 'Chuyên gia chẩn đoán trước sinh, quản lý thai kỳ nguy cơ cao và phụ khoa.',
                'city' => 'Hồ Chí Minh',
                'address' => 'Quận 5, TP.HCM',
                'latitude' => 10.7560000,
                'longitude' => 106.6580000,
                'consultation_fee' => 300000,
                'avatar' => 'doctors/vu-bich-ngoc.png',
            ],
            [
                'id' => 6,
                'user_id' => null,
                'specialty_id' => $specialties['CK05']->id, // Tai Mũi Họng
                'hospital_id' => 2,
                'name' => 'BS.CKII Đỗ Thành Trung',
                'title' => 'Bác sĩ Chuyên khoa II',
                'years_experience' => 16,
                'bio' => 'Phẫu thuật nội soi mũi xoang và điều trị các bệnh lý họng thanh quản.',
                'city' => 'Hồ Chí Minh',
                'address' => 'Quận 5, TP.HCM',
                'latitude' => 10.7550000,
                'longitude' => 106.6570000,
                'consultation_fee' => 250000,
                'avatar' => 'doctors/do-thanh-trung.png',
            ],
            [
                'id' => 7,
                'user_id' => null,
                'specialty_id' => $specialties['CK06']->id, // Răng Hàm Mặt
                'hospital_id' => null, // Phòng khám tư nhân
                'name' => 'ThS.BS Hoàng Gia Khánh',
                'title' => 'Thạc sĩ Bác sĩ',
                'years_experience' => 9,
                'bio' => 'Chuyên sâu chỉnh nha, cấy ghép Implant và phục hình thẩm mỹ.',
                'city' => 'Hồ Chí Minh',
                'address' => '120 Cách Mạng Tháng 8, Quận 3',
                'latitude' => 10.7765432,
                'longitude' => 106.6854321,
                'consultation_fee' => 180000,
                'avatar' => 'doctors/hoang-gia-khanh.png',
            ],
            [
                'id' => 8,
                'user_id' => null,
                'specialty_id' => $specialties['CK07']->id, // Mắt
                'hospital_id' => null,
                'name' => 'BS.CKI Nguyễn Thu Hà',
                'title' => 'Bác sĩ Chuyên khoa I',
                'years_experience' => 11,
                'bio' => 'Điều trị tật khúc xạ, khô mắt, đục thủy tinh thể và thoái hóa võng mạc.',
                'city' => 'Hồ Chí Minh',
                'address' => '280 Điện Biên Phủ, Quận 3',
                'latitude' => 10.7823456,
                'longitude' => 106.6890123,
                'consultation_fee' => 220000,
                'avatar' => 'doctors/nguyen-thu-ha.png',
            ],
            [
                'id' => 9,
                'user_id' => null,
                'specialty_id' => $specialties['CK08']->id, // Da liễu
                'hospital_id' => 2,
                'name' => 'ThS.BS Đặng Minh Châu',
                'title' => 'Thạc sĩ Bác sĩ',
                'years_experience' => 8,
                'bio' => 'Khám chữa viêm da cơ địa, mụn trứng cá và trẻ hóa làn da công nghệ cao.',
                'city' => 'Hồ Chí Minh',
                'address' => 'Quận 5, TP.HCM',
                'latitude' => 10.7570000,
                'longitude' => 106.6590000,
                'consultation_fee' => 280000,
                'avatar' => 'doctors/dang-minh-chau.png',
            ],
            [
                'id' => 10,
                'user_id' => null,
                'specialty_id' => $specialties['CK09']->id, // Cơ Xương Khớp
                'hospital_id' => 5, // BV Việt Đức (Hà Nội)
                'name' => 'PGS.TS Trần Quang Hưng',
                'title' => 'Phó Giáo sư, Tiến sĩ',
                'years_experience' => 22,
                'bio' => 'Chuyên gia đầu ngành về phẫu thuật cột sống và thoái hóa khớp gối.',
                'city' => 'Hà Nội',
                'address' => '40 Tràng Thi, Hoàn Kiếm',
                'latitude' => 21.0289123,
                'longitude' => 105.8487654,
                'consultation_fee' => 450000,
                'avatar' => 'doctors/tran-quang-hung.png',
            ],
            [
                'id' => 11,
                'user_id' => null,
                'specialty_id' => $specialties['CK10']->id, // Tiêu hóa
                'hospital_id' => 4, // BV Bạch Mai
                'name' => 'TS.BS Ngô Văn Dũng',
                'title' => 'Tiến sĩ Bác sĩ',
                'years_experience' => 17,
                'bio' => 'Nội soi can thiệp điều trị xuất huyết tiêu hóa, viêm gan virus và polyp dạ dày.',
                'city' => 'Hà Nội',
                'address' => '78 Giải Phóng, Đống Đa',
                'latitude' => 20.9990000,
                'longitude' => 105.8410000,
                'consultation_fee' => 380000,
                'avatar' => 'doctors/ngo-van-dung.png',
            ],
            [
                'id' => 12,
                'user_id' => null,
                'specialty_id' => $specialties['CK11']->id, // Thần kinh
                'hospital_id' => 4,
                'name' => 'BS.CKII Phan Hải Yến',
                'title' => 'Bác sĩ Chuyên khoa II',
                'years_experience' => 19,
                'bio' => 'Chẩn đoán và phục hồi bệnh Parkinson, đột quỵ và đau dây thần kinh số V.',
                'city' => 'Hà Nội',
                'address' => '78 Giải Phóng, Đống Đa',
                'latitude' => 21.0001000,
                'longitude' => 105.8420000,
                'consultation_fee' => 320000,
                'avatar' => 'doctors/phan-hai-yen.png',
            ],
            [
                'id' => 13,
                'user_id' => null,
                'specialty_id' => $specialties['CK12']->id, // Hô hấp
                'hospital_id' => 4,
                'name' => 'ThS.BS Bùi Tuấn Kiệt',
                'title' => 'Thạc sĩ Bác sĩ',
                'years_experience' => 13,
                'bio' => 'Điều trị chuyên sâu hen phế quản, COPD và các hội chứng ngưng thở khi ngủ.',
                'city' => 'Hà Nội',
                'address' => '78 Giải Phóng, Đống Đa',
                'latitude' => 20.9985000,
                'longitude' => 105.8415000,
                'consultation_fee' => 260000,
                'avatar' => 'doctors/bui-tuan-kiet.png',
            ],
            [
                'id' => 14,
                'user_id' => null,
                'specialty_id' => $specialties['CK13']->id, // Ngoại tổng quát
                'hospital_id' => 5, // BV Việt Đức
                'name' => 'TS.BS Vũ Trọng Thắng',
                'title' => 'Tiến sĩ Bác sĩ',
                'years_experience' => 20,
                'bio' => 'Phẫu thuật nội soi ổ bụng, tuyến giáp và thoát vị bẹn.',
                'city' => 'Hà Nội',
                'address' => '40 Tràng Thi, Hoàn Kiếm',
                'latitude' => 21.0290000,
                'longitude' => 105.8490000,
                'consultation_fee' => 400000,
                'avatar' => 'doctors/vu-trong-thang.png',
            ],
            [
                'id' => 15,
                'user_id' => null,
                'specialty_id' => $specialties['CK14']->id, // Ung bướu
                'hospital_id' => 4, // BV Bạch Mai
                'name' => 'BS.CKII Mai Thị Kim Dung',
                'title' => 'Bác sĩ Chuyên khoa II',
                'years_experience' => 15,
                'bio' => 'Tầm soát ung thư sớm, điều trị hóa trị và chăm sóc giảm nhẹ.',
                'city' => 'Hà Nội',
                'address' => '78 Giải Phóng, Đống Đa',
                'latitude' => 20.9995000,
                'longitude' => 105.8405000,
                'consultation_fee' => 350000,
                'avatar' => 'doctors/mai-thi-kim-dung.png',
            ],
            [
                'id' => 16,
                'user_id' => null,
                'specialty_id' => $specialties['CK01']->id, // Nhi khoa (Hà Nội)
                'hospital_id' => 6, // BV Nhi Trung ương
                'name' => 'ThS.BS Nguyễn Phương Thảo',
                'title' => 'Thạc sĩ Bác sĩ',
                'years_experience' => 10,
                'bio' => 'Khám chữa các bệnh lý nhiễm trùng, dị ứng và miễn dịch lâm sàng trẻ em.',
                'city' => 'Hà Nội',
                'address' => '18/879 La Thành, Đống Đa',
                'latitude' => 21.0245678,
                'longitude' => 105.8123456,
                'consultation_fee' => 220000,
                'avatar' => 'doctors/nguyen-phuong-thao.png',
            ],
            [
                'id' => 17,
                'user_id' => null,
                'specialty_id' => $specialties['CK02']->id, // Nội tổng quát (Hà Nội)
                'hospital_id' => 4,
                'name' => 'BS.CKI Đinh Văn Hùng',
                'title' => 'Bác sĩ Chuyên khoa I',
                'years_experience' => 7,
                'bio' => 'Tư vấn tầm soát sức khỏe tổng quát và điều trị tăng huyết áp người cao tuổi.',
                'city' => 'Hà Nội',
                'address' => '78 Giải Phóng, Đống Đa',
                'latitude' => 20.9992000,
                'longitude' => 105.8425000,
                'consultation_fee' => 150000, // Thấp nhất 150k theo đề
                'avatar' => 'doctors/dinh-van-hung.png',
            ],
            [
                'id' => 18,
                'user_id' => null,
                'specialty_id' => $specialties['CK03']->id, // Tim mạch (Chợ Rẫy)
                'hospital_id' => 1,
                'name' => 'ThS.BS Lâm Nhật Minh',
                'title' => 'Thạc sĩ Bác sĩ',
                'years_experience' => 11,
                'bio' => 'Khám siêu âm doppler tim, xơ vữa động mạch và bệnh mạch máu ngoại biên.',
                'city' => 'Hồ Chí Minh',
                'address' => '201B Nguyễn Chí Thanh, Quận 5',
                'latitude' => 10.7575000,
                'longitude' => 106.6591000,
                'consultation_fee' => 300000,
                'avatar' => 'doctors/lam-nhat-minh.png',
            ],
        ];

        foreach ($doctors as $item) {
            Doctor::updateOrCreate(
                ['id' => $item['id']],
                $item
            );
        }
    }
}

