<?php

// Documentation illustration only: no database, live token, or real patient data.
use Endroid\QrCode\Label\Font\NotoSans;
use Endroid\QrCode\QrCode;
use Endroid\QrCode\Writer\PngWriter;
use Firebase\JWT\JWT;

require __DIR__.'/../../vendor/autoload.php';

$token = JWT::encode([
    'iss' => 'medsi-doc-example', 'aud' => 'documentation-only',
    'sub' => 'TKT-20261105-DEMO01', 'iat' => 1793836800, 'exp' => 1794099600,
], 'documentation-only-public-key-never-use-in-app', 'HS256');
$qr = imagecreatefromstring((new PngWriter)->write(QrCode::create($token)->setSize(360)->setMargin(24))->getString());
$canvas = imagecreatetruecolor(900, 1220);
$white = imagecolorallocate($canvas, 255, 255, 255);
$ink = imagecolorallocate($canvas, 15, 23, 42);
$blue = imagecolorallocate($canvas, 3, 105, 161);
$muted = imagecolorallocate($canvas, 71, 85, 105);
imagefill($canvas, 0, 0, $white);
$font = (new NotoSans)->getPath();
$text = function (int $y, string $value, int $size = 20, ?int $color = null) use ($canvas, $font, $ink): void {
    imagettftext($canvas, $size, 0, 65, $y, $color ?? $ink, $font, $value);
};
$text(75, 'MedSi · PHIẾU KHÁM', 30, $blue);
$text(125, 'MẪU MINH HỌA · KHÔNG CÓ GIÁ TRỊ TIẾP NHẬN', 16, $muted);
imageline($canvas, 65, 155, 835, 155, $muted);
$text(205, 'Mã phiếu: TKT-20261105-DEMO01');
$text(265, 'Số thứ tự: CK03-001', 30, $blue);
$text(320, 'Bệnh viện mẫu MedSi');
$text(365, 'Chuyên khoa: Tiêu hóa · Khám chuyên khoa');
$text(410, 'Người khám: Bệnh nhân mẫu (dữ liệu giả lập)');
$text(455, 'Ngày khám: 07/11/2026 · Ca: 09:00–12:00');
$text(500, 'Trạng thái minh họa: ISSUED');
imagecopy($canvas, $qr, 246, 530, 0, 0, imagesx($qr), imagesy($qr));
$text(1000, 'Dặn dò chuyên khoa', 24, $blue);
$text(1050, 'Đến quầy tiếp đón trước giờ hẹn 15 phút.');
$text(1095, 'Mang giấy tờ cần thiết theo hướng dẫn của cơ sở.');
$text(1170, 'QR minh họa dùng khóa riêng, không dùng để check-in.', 15, $muted);
$directory = __DIR__.'/../../../docs/images';
if (! is_dir($directory)) {
    mkdir($directory, 0777, true);
}
imagepng($canvas, $directory.'/medsi-ticket-sample.png');
echo "Saved docs/images/medsi-ticket-sample.png\n";
