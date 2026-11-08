<?php

namespace App\Services;

class VietQrDemo
{
    // Synthetic recipient for a scan-only demonstration. Never request a transfer.
    public const BANK_BIN = '123456';
    public const ACCOUNT = '0000000000';

    public static function payload(int $amount, string $description): string
    {
        $recipient = self::field('00', self::BANK_BIN).self::field('01', self::ACCOUNT);
        $merchant = self::field('00', 'A000000727').self::field('01', $recipient).self::field('02', 'QRIBFTTA');
        $body = '000201010212'.self::field('38', $merchant).'5303704'
            .self::field('54', (string) $amount).'5802VN'
            .self::field('62', self::field('08', $description)).'6304';

        // EMV QR uses CRC-16/CCITT-FALSE over the full payload through the CRC header.
        $crc = 0xFFFF;
        foreach (str_split($body) as $byte) {
            $crc ^= ord($byte) << 8;
            for ($bit = 0; $bit < 8; $bit++) {
                $crc = (($crc & 0x8000) ? ($crc << 1) ^ 0x1021 : $crc << 1) & 0xFFFF;
            }
        }

        return $body.sprintf('%04X', $crc);
    }

    private static function field(string $tag, string $value): string
    {
        return $tag.sprintf('%02d', strlen($value)).$value;
    }
}
