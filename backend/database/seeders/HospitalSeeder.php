<?php

namespace Database\Seeders;

use App\Models\Hospital;
use Illuminate\Database\Seeder;

class HospitalSeeder extends Seeder
{
    public function run(): void
    {
        $hospitals = [
            // Khu vực TP. Hồ Chí Minh (3 bệnh viện)
            [
                'id' => 1,
                'name' => 'Bệnh viện Chợ Rẫy',
                'description' => 'Bệnh viện đa khoa tuyến cuối đặc biệt khu vực phía Nam với đầy đủ các chuyên khoa sâu.',
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
                'description' => 'Mô hình kết hợp Viện - Trường hiện đại chuẩn quốc tế, thế mạnh Tim mạch và Tiêu hóa.',
                'address' => '215 Hồng Bàng, Phường 11, Quận 5',
                'city' => 'Hồ Chí Minh',
                'latitude' => 10.7554120,
                'longitude' => 106.6578910,
                'hotline' => '02838554269',
                'image' => 'hospitals/dhy-duoc.png',
            ],
            [
                'id' => 3,
                'name' => 'Bệnh viện Nhi Đồng 1',
                'description' => 'Bệnh viện chuyên khoa Nhi hàng đầu miền Nam chuyên sâu hồi sức, phẫu thuật và tim bẩm sinh.',
                'address' => '341 Sư Vạn Hạnh, Phường 10, Quận 10',
                'city' => 'Hồ Chí Minh',
                'latitude' => 10.7712345,
                'longitude' => 106.6705678,
                'hotline' => '02839271119',
                'image' => 'hospitals/nhi-dong-1.png',
            ],

            // Khu vực Hà Nội (3 bệnh viện)
            [
                'id' => 4,
                'name' => 'Bệnh viện Bạch Mai',
                'description' => 'Bệnh viện đa khoa hạng đặc biệt đầu ngành miền Bắc với viện Tim mạch quốc gia hàng đầu.',
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
                'description' => 'Trung tâm phẫu thuật ngoại khoa và cơ xương khớp lớn nhất cả nước.',
                'address' => '40 Tràng Thi, Hàng Bông, Hoàn Kiếm',
                'city' => 'Hà Nội',
                'latitude' => 21.0289123,
                'longitude' => 105.8487654,
                'hotline' => '02438253531',
                'image' => 'hospitals/viet-duc.png',
            ],
            [
                'id' => 6,
                'name' => 'Bệnh viện Nhi Trung ương',
                'description' => 'Bệnh viện chuyên khoa Nhi tuyến cuối của cả nước về điều trị và nghiên cứu nhi khoa.',
                'address' => '18/879 La Thành, Láng Thượng, Đống Đa',
                'city' => 'Hà Nội',
                'latitude' => 21.0245678,
                'longitude' => 105.8123456,
                'hotline' => '02462738500',
                'image' => 'hospitals/nhi-tw.png',
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
