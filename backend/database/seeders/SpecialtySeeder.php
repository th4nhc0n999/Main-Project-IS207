<?php

namespace Database\Seeders;

use App\Models\Specialty;
use Illuminate\Database\Seeder;

class SpecialtySeeder extends Seeder
{
    public function run(): void
    {
        $specialties = [
            [
                'code' => 'CK01',
                'name' => 'Nhi khoa',
                'slug' => 'nhi-khoa',
                'description' => 'Khám và điều trị toàn diện các bệnh lý ở trẻ sơ sinh, trẻ nhỏ và thiếu niên.',
                'default_instructions' => 'Mang theo sổ tiêm chủng và hồ sơ bệnh án cũ của trẻ (nếu có).',
                'image' => 'specialties/nhi-khoa.png',
            ],
            [
                'code' => 'CK02',
                'name' => 'Nội tổng quát',
                'slug' => 'noi-tong-quat',
                'description' => 'Chẩn đoán và điều trị không phẫu thuật các bệnh lý nội khoa người lớn.',
                'default_instructions' => 'Nên nhịn ăn sáng trước 8 tiếng nếu có chỉ định xét nghiệm máu tổng quát.',
                'image' => 'specialties/noi-tong-quat.png',
            ],
            [
                'code' => 'CK03', // Bắt buộc CK03 = Tim mạch theo tài liệu
                'name' => 'Tim mạch',
                'slug' => 'tim-mach',
                'description' => 'Khám, chẩn đoán, can thiệp và điều trị các bệnh lý tim và mạch máu.',
                'default_instructions' => 'Mang theo các đơn thuốc tim mạch đang uống và kết quả điện tâm đồ gần nhất.',
                'image' => 'specialties/tim-mach.png',
            ],
            [
                'code' => 'CK04',
                'name' => 'Sản phụ khoa',
                'slug' => 'san-phu-khoa',
                'description' => 'Chăm sóc sức khỏe sinh sản, khám thai định kỳ và điều trị bệnh phụ khoa.',
                'default_instructions' => 'Chuẩn bị sổ theo dõi thai kỳ hoặc kết quả siêu âm gần nhất.',
                'image' => 'specialties/san-phu-khoa.png',
            ],
            [
                'code' => 'CK05',
                'name' => 'Tai Mũi Họng',
                'slug' => 'tai-mui-hong',
                'description' => 'Khám và điều trị các bệnh lý đường hô hấp trên, thính giác và thanh quản.',
                'default_instructions' => 'Vệ sinh tai mũi họng nhẹ nhàng trước khi vào khám nội soi.',
                'image' => 'specialties/tai-mui-hong.png',
            ],
            [
                'code' => 'CK06',
                'name' => 'Răng Hàm Mặt',
                'slug' => 'rang-ham-mat',
                'description' => 'Khám chữa các bệnh lý răng miệng, nha chu và phẫu thuật hàm mặt thẩm mỹ.',
                'default_instructions' => 'Không nên dùng chất kích thích hoặc thuốc lá trước giờ khám răng.',
                'image' => 'specialties/rang-ham-mat.png',
            ],
            [
                'code' => 'CK07',
                'name' => 'Mắt (Nhãn khoa)',
                'slug' => 'mat',
                'description' => 'Kiểm tra thị lực, đo khúc xạ và điều trị các bệnh lý nhãn khoa chuyên sâu.',
                'default_instructions' => 'Không đeo kính áp tròng ít nhất 24 giờ trước khi khám khúc xạ.',
                'image' => 'specialties/mat.png',
            ],
            [
                'code' => 'CK08',
                'name' => 'Da liễu',
                'slug' => 'da-lieu',
                'description' => 'Khám và điều trị các bệnh lý về da, tóc, móng và thẩm mỹ da liễu.',
                'default_instructions' => 'Không bôi các loại kem trị liệu hoặc mỹ phẩm lên vùng da cần khám.',
                'image' => 'specialties/da-lieu.png',
            ],
            [
                'code' => 'CK09',
                'name' => 'Cơ Xương Khớp',
                'slug' => 'co-xuong-khop',
                'description' => 'Chẩn đoán và phục hồi các bệnh thoái hóa khớp, viêm khớp và chấn thương cột sống.',
                'default_instructions' => 'Mang theo phim X-quang hoặc MRI đã chụp trong vòng 6 tháng gần nhất.',
                'image' => 'specialties/co-xuong-khop.png',
            ],
            [
                'code' => 'CK10',
                'name' => 'Tiêu hóa - Gan mật',
                'slug' => 'tieu-hoa-gan-mat',
                'description' => 'Khám và nội soi điều trị dạ dày, đại tràng, gan mật và tụy tạng.',
                'default_instructions' => 'Nhịn ăn uống hoàn toàn ít nhất 6 tiếng trước giờ nội soi dạ dày/đại tràng.',
                'image' => 'specialties/tieu-hoa.png',
            ],
            [
                'code' => 'CK11',
                'name' => 'Thần kinh',
                'slug' => 'than-kinh',
                'description' => 'Điều trị các rối loạn thần kinh, đau đầu mãn tính, mất ngủ và tai biến mạch máu não.',
                'default_instructions' => 'Ghi chú lại tần suất các cơn đau đầu hoặc co giật trước khi gặp bác sĩ.',
                'image' => 'specialties/than-kinh.png',
            ],
            [
                'code' => 'CK12',
                'name' => 'Hô hấp - Phổi',
                'slug' => 'ho-hap',
                'description' => 'Khám và điều trị các bệnh lý phế quản, hen suyễn, COPD và viêm phổi.',
                'default_instructions' => 'Tránh sử dụng thuốc giãn phế quản ngắn trước khi đo chức năng hô hấp 4 giờ.',
                'image' => 'specialties/ho-hap.png',
            ],
            [
                'code' => 'CK13',
                'name' => 'Ngoại tổng quát',
                'slug' => 'ngoai-tong-quat',
                'description' => 'Tư vấn phẫu thuật tiêu hóa, thoát vị bẹn, trĩ và các tiểu phẫu ngoại trú.',
                'default_instructions' => 'Mang theo đầy đủ hồ sơ xét nghiệm tiền phẫu đã thực hiện.',
                'image' => 'specialties/ngoai-tong-quat.png',
            ],
            [
                'code' => 'CK14',
                'name' => 'Ung bướu',
                'slug' => 'ung-buou',
                'description' => 'Tầm soát ung thư sớm, tư vấn phác đồ hóa trị, xạ trị và theo dõi sau điều trị.',
                'default_instructions' => 'Mang theo toàn bộ kết quả giải phẫu bệnh và sinh thiết (nếu có).',
                'image' => 'specialties/ung-buou.png',
            ],
        ];

        foreach ($specialties as $item) {
            Specialty::updateOrCreate(
                ['code' => $item['code']],
                $item
            );
        }
    }
}
