<?php

namespace App\Services;

use App\Exceptions\Booking\TicketException;
use Carbon\CarbonImmutable;
use Endroid\QrCode\QrCode;
use Endroid\QrCode\Writer\PngWriter;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use LogicException;
use Throwable;

class TicketQrService
{
    public function sign(string $ticketCode, string $workDate): string
    {
        return JWT::encode([
            'iss' => 'medsi',
            'aud' => 'ticket-check-in',
            'sub' => $ticketCode,
            'iat' => now()->timestamp,
            'exp' => CarbonImmutable::parse($workDate, config('app.timezone'))->addDay()->startOfDay()->timestamp,
        ], $this->key(), 'HS256');
    }

    public function verify(string $token): string
    {
        $key = $this->key();
        $previousTimestamp = JWT::$timestamp;
        try {
            JWT::$timestamp = now()->timestamp;
            $claims = JWT::decode($token, new Key($key, 'HS256'));
            if (($claims->iss ?? null) !== 'medsi' || ($claims->aud ?? null) !== 'ticket-check-in'
                || ! is_string($claims->sub ?? null) || ! is_int($claims->iat ?? null)
                || ! is_int($claims->exp ?? null) || $claims->iat > now()->timestamp) {
                throw new TicketException('Mã QR không hợp lệ hoặc đã hết hạn.');
            }

            return $claims->sub;
        } catch (Throwable) {
            throw new TicketException('Mã QR không hợp lệ hoặc đã hết hạn.');
        } finally {
            JWT::$timestamp = $previousTimestamp;
        }
    }

    public function png(string $token): string
    {
        return (new PngWriter)->write(QrCode::create($token)->setSize(400)->setMargin(24))->getString();
    }

    private function key(): string
    {
        $secret = (string) config('medsi.qr_secret');
        if ($secret !== '') {
            if (strlen($secret) < 32) {
                throw new LogicException('MEDSI_QR_SECRET must contain at least 32 bytes.');
            }

            return $secret;
        }

        $appKey = (string) config('app.key');
        if ($appKey === '') {
            throw new LogicException('Configure APP_KEY or MEDSI_QR_SECRET before issuing tickets.');
        }

        return hash_hmac('sha256', 'medsi-ticket-qr', $appKey, true);
    }
}
