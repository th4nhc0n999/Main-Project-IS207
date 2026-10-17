<?php

namespace Tests\Feature;

use App\Http\Resources\HospitalResource;
use App\Models\ExamType;
use App\Models\Hospital;
use App\Models\Slot;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HospitalResourceTest extends TestCase
{
    use RefreshDatabase;

    public function test_hospital_resource_formats_basic_fields(): void
    {
        $hospital = Hospital::factory()->create([
            'name' => 'Bệnh viện Bạch Mai',
            'address' => '78 Giải Phóng, Đống Đa',
            'city' => 'Hà Nội',
            'hotline' => '02438693731',
            'description' => 'Bệnh viện đa khoa đầu ngành',
        ]);

        $resource = (new HospitalResource($hospital))->resolve();

        $this->assertEquals($hospital->id, $resource['id']);
        $this->assertEquals('Bệnh viện Bạch Mai', $resource['name']);
        $this->assertEquals('78 Giải Phóng, Đống Đa', $resource['address']);
        $this->assertEquals('Hà Nội', $resource['city']);
        $this->assertEquals('02438693731', $resource['phone']);
        $this->assertEquals('02438693731', $resource['hotline']);
        $this->assertEquals('Bệnh viện đa khoa đầu ngành', $resource['description']);
        $this->assertEquals('active', $resource['status']);
        $this->assertArrayHasKey('created_at', $resource);
        $this->assertArrayHasKey('updated_at', $resource);
        $this->assertArrayNotHasKey('exam_types', $resource);
        $this->assertArrayNotHasKey('slots', $resource);
    }

    public function test_hospital_resource_includes_loaded_exam_types_and_slots(): void
    {
        $hospital = Hospital::factory()->create([
            'name' => 'Bệnh viện Chợ Rẫy',
        ]);

        $examType = ExamType::factory()->for($hospital)->create([
            'name' => 'Khám tổng quát VIP',
            'price' => 1200000,
        ]);

        $slot = Slot::factory()->forHospital($hospital, 10)->create([
            'work_date' => now()->addDay()->toDateString(),
            'start_time' => '08:00:00',
            'end_time' => '09:00:00',
            'capacity' => 10,
            'booked_count' => 2,
            'status' => 'available',
        ]);

        $hospital->load(['examTypes', 'slots']);

        $resource = (new HospitalResource($hospital))->resolve();

        $this->assertArrayHasKey('exam_types', $resource);
        $this->assertCount(1, $resource['exam_types']);
        $this->assertEquals('Khám tổng quát VIP', $resource['exam_types'][0]['name']);
        $this->assertEquals(1200000, $resource['exam_types'][0]['price']);

        $this->assertArrayHasKey('slots', $resource);
        $this->assertCount(1, $resource['slots']);
        $this->assertEquals('available', $resource['slots'][0]['status']);
        $this->assertEquals(10, $resource['slots'][0]['capacity']);
        $this->assertEquals(2, $resource['slots'][0]['booked_count']);
    }
}
