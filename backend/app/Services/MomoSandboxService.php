<?php

namespace App\Services;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class MomoSandboxService
{
    private const ENDPOINT = 'https://test-payment.momo.vn/v2/gateway/api/';

    public const METHODS = ['momo' => 'captureWallet', 'atm' => 'payWithATM', 'credit_card' => 'payWithCC'];

    public function assertConfigured(): void
    {
        abort_unless(app()->environment(['local', 'testing']), 403, 'MoMo sandbox chỉ dùng trong môi trường thử nghiệm.');
        foreach (['partner_code', 'access_key', 'secret_key', 'ipn_url', 'redirect_url'] as $key) {
            abort_if(blank(config('payment.momo.'.$key)), 503, 'Chưa cấu hình MoMo sandbox. Cần thông tin đối tác và URL callback/redirect.');
        }
        foreach (['ipn_url', 'redirect_url'] as $key) {
            $url = config('payment.momo.'.$key);
            abort_unless(filter_var($url, FILTER_VALIDATE_URL) && parse_url($url, PHP_URL_SCHEME) === 'https',
                503, 'URL MoMo sandbox phải là HTTPS.');
        }
    }

    public function checkout(object $transaction, string $method, string $email): array
    {
        $this->assertConfigured();
        $max = $method === 'credit_card' ? 10000000 : 50000000;
        if ($transaction->amount < 1000 || $transaction->amount > $max) {
            throw ValidationException::withMessages(['amount' => 'Số tiền ngoài hạn mức của phương thức MoMo.']);
        }
        if ($method === 'credit_card' && ! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw ValidationException::withMessages(['email' => 'Thanh toán thẻ quốc tế cần email tài khoản hợp lệ.']);
        }

        // Persist the attempt before HTTP. An uncertain response must not start a second collection.
        $state = DB::transaction(function () use ($transaction) {
            $row = DB::table('payment_transactions')->where('id', $transaction->id)->lockForUpdate()->first();
            $meta = $this->metadata($row);
            abort_unless(($meta['provider'] ?? '') === 'momo_sandbox', 422, 'Giao dịch không thuộc MoMo sandbox.');
            if ($row->status !== 'pending' || isset($meta['create_attempted_at'])) {
                return ['send' => false, 'meta' => $meta];
            }
            $meta['create_attempted_at'] = now()->toIso8601String();
            $meta['partner_code'] = config('payment.momo.partner_code');
            $this->saveMetadata($row->id, $meta);

            return ['send' => true, 'meta' => $meta];
        });
        if (! $state['send']) {
            return $this->checkoutData($state['meta']);
        }
        $code = $transaction->transaction_code;
        $body = [
            'partnerCode' => config('payment.momo.partner_code'), 'requestId' => $code,
            'orderId' => $code, 'amount' => (int) $transaction->amount,
            'orderInfo' => 'MedSi booking payment', 'redirectUrl' => config('payment.momo.redirect_url'),
            'ipnUrl' => config('payment.momo.ipn_url'), 'requestType' => self::METHODS[$method],
            'extraData' => '', 'autoCapture' => true, 'lang' => 'vi',
        ];
        $body['signature'] = $this->sign($body, ['amount', 'extraData', 'ipnUrl', 'orderId',
            'orderInfo', 'partnerCode', 'redirectUrl', 'requestId', 'requestType']);
        if ($method === 'credit_card') {
            $body['userInfo'] = ['email' => $email];
        }
        $data = $this->post('create', $body);
        $this->assertIdentity($data, $transaction, $code);
        // resultCode=0 here means a checkout was created, NOT that money was received.
        $links = [];
        if ((int) $data['resultCode'] === 0) {
            foreach (['payUrl', 'qrCodeUrl', 'deeplink'] as $key) {
                if (isset($data[$key]) && is_string($data[$key]) && strlen($data[$key]) <= 8192) {
                    $links[$key] = $data[$key];
                }
            }
            if (isset($links['payUrl'])) {
                abort_unless(parse_url($links['payUrl'], PHP_URL_SCHEME) === 'https'
                    && parse_url($links['payUrl'], PHP_URL_HOST) === 'test-payment.momo.vn', 502, 'URL thanh toán MoMo không hợp lệ.');
            }
        }
        $meta = DB::transaction(function () use ($transaction, $data, $links) {
            $row = DB::table('payment_transactions')->where('id', $transaction->id)->lockForUpdate()->first();
            $meta = $this->metadata($row);
            $meta['create_result_code'] = (int) $data['resultCode'];
            $meta['checkout'] = $links;
            $this->saveMetadata($row->id, $meta);

            return $meta;
        });

        return $this->checkoutData($meta);
    }

    public function ipn(array $data, PaymentGatewayService $gateway): void
    {
        $this->assertConfigured();
        $expected = $this->sign($data, ['amount', 'extraData', 'message', 'orderId', 'orderInfo',
            'orderType', 'partnerCode', 'payType', 'requestId', 'responseTime', 'resultCode', 'transId']);
        abort_unless(hash_equals($expected, $data['signature']), 403, 'Chữ ký MoMo không hợp lệ.');
        $transaction = $this->find($data['orderId']);
        $this->assertIdentity($data, $transaction, $transaction->transaction_code);
        $this->recordResult($transaction, $data, $gateway);
    }

    public function refresh(object $transaction, PaymentGatewayService $gateway): object
    {
        $this->assertConfigured();
        $transaction = $this->find($transaction->transaction_code);
        $requestId = (string) Str::uuid();
        $body = ['partnerCode' => config('payment.momo.partner_code'), 'orderId' => $transaction->transaction_code,
            'requestId' => $requestId, 'lang' => 'vi'];
        $body['signature'] = $this->sign($body, ['orderId', 'partnerCode']);
        $data = $this->post('query', $body);
        $this->assertIdentity($data, $transaction, $requestId);
        // Query responses are received directly over verified HTTPS, not from a browser redirect.
        $this->recordResult($transaction, $data, $gateway);

        return DB::table('payment_transactions')->find($transaction->id);
    }

    private function recordResult(object $transaction, array $data, PaymentGatewayService $gateway): void
    {
        $result = (int) $data['resultCode'];
        // autoCapture=true: 9000 is accepted for the one-step flow per MoMo result-code documentation.
        $status = in_array($result, [0, 9000], true) ? 'success'
            : (in_array($result, [1001, 1002, 1003, 1004, 1005, 1006, 1007, 1017, 1026, 4001, 4002, 4100], true) ? 'failed' : null);
        if ($status === null) {
            return; // Pending, unknown, query-not-found and infrastructure errors never mean failed payment.
        }
        abort_unless(isset($data['transId']) && preg_match('/^\d+$/', (string) $data['transId']), 422, 'Thiếu mã giao dịch MoMo.');
        abort_if($status === 'success' && (int) $data['transId'] <= 0, 422, 'Mã giao dịch MoMo không hợp lệ.');
        DB::transaction(function () use ($transaction, $data, $gateway, $status) {
            $payment = DB::table('payments')->find($transaction->payment_id);
            // Gateway acquires the common slot -> booking -> payment -> transaction locks first.
            $gateway->callback((int) $payment->booking_id, $transaction->transaction_code,
                (int) $transaction->amount, $status);
            $row = DB::table('payment_transactions')->where('id', $transaction->id)->lockForUpdate()->first();
            $meta = $this->metadata($row);
            if (isset($meta['result']['transId'])) {
                abort_unless((string) $meta['result']['transId'] === (string) $data['transId'],
                    422, 'Mã giao dịch MoMo thay đổi, cần đối soát.');
            }
            if (! isset($meta['result'])) {
                $meta['result'] = array_intersect_key($data, array_flip(['transId', 'resultCode', 'responseTime']));
                $this->saveMetadata($row->id, $meta);
            }
        });
    }

    private function find(string $code): object
    {
        $row = DB::table('payment_transactions')->where('transaction_code', $code)->first();
        abort_unless($row && ($this->metadata($row)['provider'] ?? '') === 'momo_sandbox', 404, 'Không tìm thấy giao dịch MoMo.');

        return $row;
    }

    private function assertIdentity(array $data, object $transaction, string $requestId): void
    {
        $meta = $this->metadata(DB::table('payment_transactions')->find($transaction->id));
        abort_unless(($data['partnerCode'] ?? null) === config('payment.momo.partner_code')
            && ($meta['partner_code'] ?? null) === config('payment.momo.partner_code')
            && ($data['orderId'] ?? null) === $transaction->transaction_code
            && ($data['requestId'] ?? null) === $requestId
            && isset($data['amount']) && preg_match('/^\d+$/', (string) $data['amount'])
            && (string) $data['amount'] === (string) (int) $transaction->amount
            && isset($data['resultCode']) && filter_var($data['resultCode'], FILTER_VALIDATE_INT) !== false,
            422, 'Kết quả MoMo không khớp giao dịch.');
    }

    private function sign(array $data, array $keys): string
    {
        $parts = ['accessKey='.config('payment.momo.access_key')];
        foreach ($keys as $key) {
            $parts[] = $key.'='.($data[$key] ?? '');
        }

        return hash_hmac('sha256', implode('&', $parts), config('payment.momo.secret_key'));
    }

    private function post(string $action, array $body): array
    {
        try {
            $response = Http::asJson()->acceptJson()->connectTimeout(10)->timeout(35)
                ->withOptions(['allow_redirects' => false])->post(self::ENDPOINT.$action, $body);
        } catch (ConnectionException) {
            abort(503, 'Chưa nhận được phản hồi MoMo. Giữ giao dịch chờ và truy vấn lại, không tạo khoản thu mới.');
        }
        abort_unless($response->successful() && is_array($response->json()), 502, 'MoMo chưa trả kết quả hợp lệ. Cần truy vấn lại giao dịch.');

        return $response->json();
    }

    private function metadata(object $row): array
    {
        return json_decode($row->raw_payload ?? '{}', true) ?: [];
    }

    private function saveMetadata(int $id, array $meta): void
    {
        DB::table('payment_transactions')->where('id', $id)->update([
            'raw_payload' => json_encode($meta, JSON_THROW_ON_ERROR), 'updated_at' => now(),
        ]);
    }

    private function checkoutData(array $meta): array
    {
        return ['provider' => 'momo_sandbox', 'simulation' => false, 'sandbox' => true,
            'checkout' => $meta['checkout'] ?? [], 'gateway_result_code' => $meta['create_result_code'] ?? null,
            'needs_query' => empty($meta['checkout'])];
    }
}
