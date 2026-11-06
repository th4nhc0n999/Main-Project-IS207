<?php

namespace App\Support;

class DataMasker
{
    /**
     * Che mờ số điện thoại: giữ 3 số đầu, 2 số cuối, thay ở giữa bằng *****
     * Ví dụ: 0912345678 -> 091*****78
     */
    public static function maskPhone(?string $phone): ?string
    {
        if (!$phone || strlen($phone) < 7) {
            return $phone;
        }

        return substr($phone, 0, 3) . '*****' . substr($phone, -2);
    }

    /**
     * Che mờ số CCCD / CMND: giữ 6 số đầu (hoặc 3 số đối với CMND ngắn), 2 số cuối, thay ở giữa bằng ****
     * Ví dụ: 001099123456 -> 001099****56
     */
    public static function maskIdentityCard(?string $idCard): ?string
    {
        if (!$idCard) {
            return null;
        }

        $length = strlen($idCard);
        if ($length <= 5) {
            return $idCard;
        }

        $prefixLength = min(6, $length - 3);
        $prefix = substr($idCard, 0, $prefixLength);
        $suffix = substr($idCard, -2);

        return $prefix . '****' . $suffix;
    }
}
