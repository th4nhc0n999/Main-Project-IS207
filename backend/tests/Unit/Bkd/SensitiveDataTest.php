<?php

namespace Tests\Unit\Bkd;

use App\Support\Bkd\SensitiveData;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class SensitiveDataTest extends TestCase
{
    public function test_masks_identifiers_in_reasons_and_is_idempotent(): void
    {
        $text = 'CCCD 000000000001; BHYT GD0000000000000; SĐT +84 (900) 000-000.';
        $masked = SensitiveData::maskText($text);
        $this->assertSame('CCCD ********0001; BHYT GD*********0000; SĐT +** (***) **0-000.', $masked);
        $this->assertSame($masked, SensitiveData::maskText($masked));
        $this->assertSame('Nghỉ lúc 10:30, xin đổi lịch.', SensitiveData::maskText('Nghỉ lúc 10:30, xin đổi lịch.'));
        $this->assertNull(SensitiveData::maskText(null));
    }

    #[DataProvider('snapshotValues')]
    public function test_only_majority_masked_identifiers_are_accepted(mixed $value, bool $insurance, bool $valid): void
    {
        $this->assertSame($valid, SensitiveData::isMaskedIdentifier($value, $insurance));
    }

    public static function snapshotValues(): array
    {
        return [
            'null optional field' => [null, false, true],
            'empty optional field' => ['', false, true],
            'masked CCCD' => ['********0001', false, true],
            'masked phone' => ['******0000', false, true],
            'masked BHYT' => ['GD*********0000', true, true],
            'formatted masked phone' => ['+** (**) ***-0000', false, true],
            'bullet mask' => ['••••••••0001', false, true],
            'all masked' => ['************', false, true],
            'full number' => ['000000000001', false, false],
            'full number and star' => ['000000000001*', false, false],
            'full number and random suffix' => ['000000000001#*', false, false],
            'half masked only' => ['****0000', false, false],
            'majority masked but too many visible digits' => ['********00001', false, false],
            'too short to represent an identifier' => ['*001', false, false],
            'formatted full phone and star' => ['0900 000 000*', false, false],
            'no letter prefix outside BHYT' => ['AB********0001', false, false],
            'numeric input' => [1234567890, false, false],
        ];
    }
}
