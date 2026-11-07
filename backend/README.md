# MedSi Backend

Laravel 12 API, PHP 8.2+, MySQL 8.0.16+. Tài liệu thiết kế chuẩn là
[baseline Sprint 4](../docs/MedSi_Tai_lieu_thong_nhat_v0.1.md) và
[schema SQL v1.1](../docs/medsi_schema_v1.sql). Danh sách E2E và phân công nằm tại
[SPR4-requirement.md](../docs/SPR4-requirement.md).

## Trạng thái hiện tại

Backend đã có migrations cho 14 bảng nghiệp vụ, năm enum trạng thái, config MedSi,
các model nền `User`, `Booking`, `Slot` và `BookingStateMachine` cho T01-T16. API
hiện mới có `GET /api/health`; controller nghiệp vụ, seed dữ liệu mẫu, services
thanh toán/hoàn tiền và jobs chưa được triển khai. Migration `personal_access_tokens`
được giữ vì đây là bảng kỹ thuật của Sanctum.

`php artisan migrate` tạo các bảng Sanctum và MedSi. `DatabaseSeeder` hiện rỗng;
chưa có dữ liệu mẫu để chạy E2E. Migrations đã được chạy thành công bằng
`migrate:fresh --seed` trên database kiểm thử MySQL `medsi_test`. Không chạy lệnh
reset trên database có dữ liệu cần giữ. Các migration schema cũ đã bị gỡ và chưa có
backfill/upgrade migration; không chạy `php artisan migrate` trên database đã từng
dùng schema cũ. Dùng database local mới hoặc chuẩn bị kế hoạch chuyển dữ liệu riêng.

## Cài đặt

```bash
composer install
cp .env.example .env
php artisan key:generate
```

Thiết lập kết nối MySQL trong `.env`, sau đó chạy:

```bash
php artisan serve
```

Kiểm tra health endpoint tại `GET /api/health`.

## Kiểm tra

```bash
php artisan test
```

Unit tests cho state transitions và bài E13 trên MySQL/InnoDB đã được thêm. E13 là
opt-in và chỉ chạy trên database có tên kết thúc bằng `_test`:

```bash
RUN_MYSQL_CONCURRENCY_TESTS=1 DB_DATABASE=medsi_test php artisan test --filter=BookingConcurrencyTest
```

Test API và các E2E còn lại vẫn cần được bổ sung theo baseline Sprint 4.