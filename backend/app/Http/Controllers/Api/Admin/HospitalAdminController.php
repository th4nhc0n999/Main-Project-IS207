<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\HospitalRequest;
use App\Services\Admin\HospitalAdminService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Throwable;

class HospitalAdminController extends Controller
{
    public function __construct(
        protected HospitalAdminService $hospitalService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $city = $request->query('city');
        $hospitals = $this->hospitalService->list($city);

        return response()->json([
            'success' => true,
            'message' => 'Lấy danh sách bệnh viện thành công.',
            'data' => $hospitals,
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $hospital = $this->hospitalService->find($id);

        return response()->json([
            'success' => true,
            'message' => 'Lấy chi tiết bệnh viện thành công.',
            'data' => $hospital,
        ]);
    }

    public function store(HospitalRequest $request): JsonResponse
    {
        try {
            $hospital = $this->hospitalService->create($request->validated());

            return response()->json([
                'success' => true,
                'message' => 'Tạo bệnh viện thành công.',
                'data' => $hospital,
            ], 201);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], 500);
        }
    }

    public function update(HospitalRequest $request, int $id): JsonResponse
    {
        try {
            $hospital = $this->hospitalService->update($id, $request->validated());

            return response()->json([
                'success' => true,
                'message' => 'Cập nhật thông tin bệnh viện thành công.',
                'data' => $hospital,
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], 500);
        }
    }

    public function destroy(int $id): JsonResponse
    {
        try {
            $this->hospitalService->delete($id);

            return response()->json([
                'success' => true,
                'message' => 'Xóa bệnh viện thành công.',
                'data' => null,
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], 422);
        }
    }
}
