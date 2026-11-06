<?php

namespace App\Support\Bkd;

final class SensitiveData
{
    public static function maskText(?string $text): ?string
    {
        if ($text === null) {
            return null;
        }

        // Include common phone/ID separators so formatting cannot bypass masking.
        return preg_replace_callback('/(?<![0-9])\+?[0-9](?:[\h().-]*[0-9]){7,}(?![0-9])/u',
            static function (array $match): string {
                $digits = preg_match_all('/[0-9]/', $match[0]);
                $visible = min(4, intdiv($digits - 1, 2));
                $remainingToMask = $digits - $visible;

                return preg_replace_callback('/[0-9]/', static function (array $digit) use (&$remainingToMask): string {
                    return $remainingToMask-- > 0 ? '*' : $digit[0];
                }, $match[0]);
            }, $text);
    }

    public static function isMaskedIdentifier(mixed $value, bool $allowInsurancePrefix = false): bool
    {
        if ($value === null || $value === '') {
            return true;
        }
        if (! is_string($value)) {
            return false;
        }

        // Only formatting, a short BHYT letter prefix, digits and actual mask
        // characters are permitted. A suffix such as "123456789012*" is unsafe.
        $compact = preg_replace('/[\h+().-]/u', '', $value);
        $pattern = $allowInsurancePrefix ? '/\A[A-Za-z]{0,3}[0-9*•]+\z/u' : '/\A[0-9*•]+\z/u';
        if (! preg_match($pattern, $compact)) {
            return false;
        }

        $digits = preg_match_all('/[0-9]/', $compact);
        $masked = preg_match_all('/[*•]/u', $compact);

        return $digits + $masked >= 8 && $digits <= 4 && $masked > $digits;
    }
}
