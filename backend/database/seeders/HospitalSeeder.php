<?php

namespace Database\Seeders;

use App\Models\Hospital;
use Illuminate\Database\Seeder;

class HospitalSeeder extends Seeder
{
    public function run(): void
    {
        $hospitals = [
            // Khu vực TP. Hồ Chí Minh (3 bệnh viện đa khoa mở, nhận khám đại trà)
            [
                'id' => 1,
                'name' => 'Bệnh viện Chợ Rẫy',
                'description' => 'Bệnh viện đa khoa tuyến cuối đặc biệt khu vực phía Nam. Tiếp nhận khám bệnh nhân mới và tái khám qua phiếu khám điện tử MedSi.',
                'address' => '201B Nguyễn Chí Thanh, Phường 12, Quận 5',
                'city' => 'Hồ Chí Minh',
                'latitude' => 10.7578234,
                'longitude' => 106.6593452,
                'hotline' => '02838554137',
                'image' => 'hospitals/cho-ray.png',
            ],
            [
                'id' => 2,
                'name' => 'Bệnh viện Đại học Y Dược TP.HCM',
                'description' => 'Mô hình kết hợp Viện - Trường hiện đại chuẩn quốc tế. Tiếp nhận khám bệnh nhân mới và tái khám qua phiếu khám điện tử MedSi.',
                'address' => '215 Hồng Bàng, Phường 11, Quận 5',
                'city' => 'Hồ Chí Minh',
                'latitude' => 10.7554120,
                'longitude' => 106.6578910,
                'hotline' => '02838554269',
                'image' => 'hospitals/dhy-duoc.png',
            ],
            [
                'id' => 3,
                'name' => 'Bệnh viện Nhân dân Gia Định',
                'description' => 'Bệnh viện đa khoa loại I hàng đầu TP.HCM, tiếp nhận mọi đối tượng bệnh nhân. Tiếp nhận khám bệnh nhân mới và tái khám qua phiếu khám điện tử MedSi.',
                'address' => '01 Nơ Trang Long, Phường 7, Quận Bình Thạnh',
                'city' => 'Hồ Chí Minh',
                'latitude' => 10.8032145,
                'longitude' => 106.6945678,
                'hotline' => '02838412692',
                'image' => 'hospitals/gia-dinh.png',
            ],

            // Khu vực Hà Nội (3 bệnh viện đa khoa mở, nhận khám đại trà)
            [
                'id' => 4,
                'name' => 'Bệnh viện Bạch Mai',
                'description' => 'Bệnh viện đa khoa hạng đặc biệt đầu ngành miền Bắc với viện Tim mạch quốc gia. Tiếp nhận khám bệnh nhân mới và tái khám qua phiếu khám điện tử MedSi.',
                'address' => '78 Giải Phóng, Phương Mai, Đống Đa',
                'city' => 'Hà Nội',
                'latitude' => 20.9997890,
                'longitude' => 105.8412340,
                'hotline' => '02438693731',
                'image' => 'hospitals/bach-mai.png',
            ],
            [
                'id' => 5,
                'name' => 'Bệnh viện Hữu nghị Việt Đức',
                'description' => 'Trung tâm phẫu thuật ngoại khoa và đa khoa lớn nhất cả nước. Tiếp nhận khám bệnh nhân mới và tái khám qua phiếu khám điện tử MedSi.',
                'address' => '40 Tràng Thi, Hàng Bông, Hoàn Kiếm',
                'city' => 'Hà Nội',
                'latitude' => 21.0289123,
                'longitude' => 105.8487654,
                'hotline' => '02438253531',
                'image' => 'hospitals/viet-duc.png',
            ],
            [
                'id' => 6,
                'name' => 'Bệnh viện Đa khoa Xanh Pôn',
                'description' => 'Bệnh viện đa khoa hạng I tuyến đầu của thủ đô Hà Nội. Tiếp nhận khám bệnh nhân mới và tái khám qua phiếu khám điện tử MedSi.',
                'address' => '12 Chu Văn An, Điện Bàn, Ba Đình',
                'city' => 'Hà Nội',
                'latitude' => 21.0312456,
                'longitude' => 105.8354678,
                'hotline' => '02438233075',
                'image' => 'hospitals/xanh-pon.png',
            ],
        ];

        foreach ($hospitals as $item) {
            Hospital::updateOrCreate(
                ['id' => $item['id']],
                $item
            );
        }
    }
}
