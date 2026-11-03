# MedSi

MedSi là ứng dụng đặt lịch khám trực tuyến, gồm Laravel 12 API và React/Vite.
Tài liệu sản phẩm và schema cho Sprint 4 được thống nhất tại
[docs/MedSi_Tai_lieu_thong_nhat_v0.1.md](docs/MedSi_Tai_lieu_thong_nhat_v0.1.md).

## Trạng thái

Tài liệu v0.1 và [schema SQL](docs/medsi_schema_v1.sql) là baseline thiết kế,
chưa đồng nghĩa toàn bộ chức năng đã được triển khai. Backend hiện có migrations
cho 14 bảng nghiệp vụ, các enum trạng thái, config MedSi, model nền `User`/`Booking`/
`Slot` và `BookingStateMachine`. API hiện mới có `GET /api/health`; controller nghiệp vụ,
seed dữ liệu mẫu, thanh toán/hoàn tiền, jobs và tích hợp frontend chưa được dựng lại.
Migration `personal_access_tokens` của Sanctum là bảng kỹ thuật và vẫn được giữ.

Danh sách E2E và phân công Sprint 4: [docs/SPR4-requirement.md](docs/SPR4-requirement.md).

Frontend hiện chưa được nối lại với API nghiệp vụ mới. Không dùng dữ liệu/migration
cũ như thể chúng đã tương thích với schema mới. Xóa các file migration không xóa
bảng hay dữ liệu đã tồn tại trong một MySQL database. Hiện chưa có migration chuyển
dữ liệu từ schema cũ sang schema mới; không chạy `php artisan migrate` trên DB đã
từng dùng schema cũ. Hãy tạo database local mới hoặc lập kế hoạch backup/backfill riêng.

## Phạm vi thiết kế

Các role có tài khoản là `patient`, `doctor`, `staff` và `admin`. `guest` không có
tài khoản DB. `staff` bắt buộc gắn với một `hospital_id`, chỉ thao tác trong cơ sở
được phân công; không có tài khoản riêng cho thiết bị check-in.

Schema nghiệp vụ có 14 bảng: `users`, `patient_profiles`,
`patient_consents`, `specialties`, `hospitals`, `doctors`, `exam_types`, `slots`,
`bookings`, `payments`, `payment_transactions`, `refunds`, `tickets` và
`audit_logs`. Chi tiết cột, enum, quan hệ và quy tắc nằm trong SQL và tài liệu
thống nhất. Các Laravel migrations đã chạy `migrate:fresh --seed` thành công trên
database kiểm thử MySQL `medsi_test`; file SQL tham chiếu chưa được import trực tiếp.

Các quy tắc chính gồm giữ chỗ 15 phút, dùng transaction và `SELECT ... FOR UPDATE`
để bảo vệ sức chứa slot, tiền VND lưu số nguyên `DECIMAL(12,0)`, phí tiện ích
20.000đ và múi giờ nghiệp vụ `Asia/Ho_Chi_Minh`.

## Chạy local

Yêu cầu: PHP 8.2+, Composer 2+, MySQL 8.0.16+ và Node.js 18+.

Backend:

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
```

Cấu hình `DB_CONNECTION`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME` và
`DB_PASSWORD` trong `.env`, sau đó chạy API:

```bash
php artisan serve
```

Trên database local mới, `php artisan migrate` tạo các migrations Sanctum và 14 bảng MedSi. `DatabaseSeeder`
hiện chưa có dữ liệu mẫu, nên E2E cần seeders/fixtures trước khi chạy. Không dùng
`migrate:fresh` trên database chứa dữ liệu cần giữ.

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Thiết lập `VITE_API_BASE_URL=http://127.0.0.1:8000/api` trong `frontend/.env`.
Các màn hình gọi API nghiệp vụ sẽ chưa hoạt động cho tới khi backend được triển khai lại.

## Kiểm tra

```bash
cd backend
php artisan test
```

Bài test concurrency E13 chạy riêng trên MySQL/InnoDB đã migrate; chỉ bật với DB tên
kết thúc bằng `_test`:

```bash
RUN_MYSQL_CONCURRENCY_TESTS=1 DB_DATABASE=medsi_test php artisan test --filter=BookingConcurrencyTest
```

```bash
cd frontend
npm run lint
npm run build
```

Kiểm thử state transition và E13 đã được thêm. Các luồng E01-E18 còn lại vẫn cần
implementation và acceptance tests theo baseline Sprint 4.