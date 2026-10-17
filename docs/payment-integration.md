# Payment: handoff M4/M5 và hợp đồng API

## Phạm vi và tình trạng phối hợp

Thiết kế này được đối chiếu với `BookingService::createHospitalBooking()` trên branch
`feature/payment`. Đây là tài liệu để M4/M5 review, chưa phải xác nhận trao đổi với teammate.
Không sửa BookingService, HospitalService, các model dùng chung, frontend hay migration.
Payment cập nhật dữ liệu booking/slot trong transaction để hoàn tất vòng đời giữ chỗ.

## Trách nhiệm giữ slot

- M5 tạo hospital booking `pending_payment`, đặt `slot_hold_expires_at` (hiện mặc định
  15 phút), tăng `slots.booked_count`, chuyển `available` thành `full` khi đầy.
- M5 tạo sẵn payment `pending`; Payment tái sử dụng record theo `booking_id` unique.
  Khi create/process, Payment tính phí khám từ exam type và phí dịch vụ từ config,
  không nhận tổng tiền từ client. M5 hiện tạo phí dịch vụ 0 nên client cần gọi
  calculate-invoice trước khi xác nhận; giá/phí được tính lại khi process, chưa có
  chức năng khóa báo giá hoặc lịch sử nhiều payment attempts.
- Payment không tăng booked_count khi thanh toán thành công: chỗ đã được M5 giữ.
- Khi `now >= slot_hold_expires_at`, Payment hủy hospital booking còn
  `pending_payment`, đổi payment `pending` thành `expired`, giảm số chỗ đúng một lần.
  `full` trở lại `available`; `blocked` vẫn giữ nguyên. Booking đã hủy là dấu hiệu
  chống giải phóng lặp. Giữ lại deadline để tra cứu.
- Cleanup cũng giải phóng hold của booking có payment `failed`, `cancelled`,
  `expired` hoặc chưa có payment, nhưng giữ nguyên kết quả payment cũ. Không đụng
  booking doctor hoặc payment `paid`/`refunded`.
- Deadline null là dữ liệu không hợp lệ: từ chối thanh toán, không tự suy diễn hết
  hạn và không tự giải phóng. Cần M5 bảo đảm deadline luôn có khi giữ chỗ.
- Hủy payment không có nghĩa hủy booking: còn thời hạn thì được đổi phương thức/thử
  lại trên cùng record, không gia hạn hold. Sau khi hold bị giải phóng phải đặt
  booking mới. Store Pay giả lập cũng dùng deadline chung, không cam kết 24 giờ.
- Các đường ghi Payment khóa theo thứ tự **slot -> booking -> payment**, cùng thứ
  tự với tạo booking Hospital. M4/M5 cần review thứ tự này cho các đường hủy/admin
  mới và không giảm booked_count lần nữa cho booking đã `cancelled`.
- Scheduler hiện có `expire-overdue-payments` mỗi phút gọi PaymentService. Số trả
  về của `expireOverduePayments()` là số hold được giải phóng, gồm hold không có
  payment. Đọc payment, tạo payment, tính invoice và process cũng kiểm tra hạn.
- Service tự mở transaction. Nếu caller bọc thêm transaction ngoài và rollback khi
  nhận SlotHoldExpiredException thì cleanup bên trong cũng rollback; API Payment
  gọi trực tiếp service và không tạo transaction ngoài.

## Process giả lập

`processPayment(int|Payment $payment, int $userId, ?string $otp = null)`:

1. Kiểm tra chủ sở hữu bằng dữ liệu mới đọc, khóa slot/booking/payment.
2. Trả lại kết quả cũ nếu đã paid; không tạo mã giao dịch hoặc paid_at mới.
3. Kiểm tra giữ chỗ, loại booking, trạng thái, patient/hospital/exam/slot nhất quán.
4. Yêu cầu `PAYMENT_DEMO_GATEWAY_ENABLED=true` cho tất cả phương thức.
5. ATM/credit_card yêu cầu OTP 6 số khớp `PAYMENT_DEMO_OTP` (mặc định 123456).
   OTP sai/thiếu hợp lệ ở tầng service ghi failed trước khi trả lỗi; validation
   sai định dạng tại API trả 422 và không cập nhật trạng thái.
6. Ghi paid, mã giao dịch giả TXN..., paid_at và booking confirmed trong cùng
   transaction; xóa deadline giữ chỗ. Sai lúc ghi sẽ rollback cả payment/booking.

Đây chỉ là giả lập để demo. Không dùng endpoint này để xác nhận tiền thật; khi tích
hợp gateway cần webhook được xác minh, tham chiếu attempt và số tiền đối soát.

## API Payment

Các route giữ `auth:sanctum`, client gửi Bearer token và `Accept: application/json`.

| HTTP | Endpoint | Body |
| --- | --- | --- |
| POST | /api/payments/calculate-invoice | booking_id: ID nguyên dương hoặc code BK... |
| POST | /api/payments/create | booking_id, method |
| POST | /api/payments/process | payment_id, otp (thẻ) |
| POST | /api/payments/confirm | Alias tương thích của process |
| GET | /api/payments/{id} | Không có body |
| POST | /api/payments/{id}/cancel | Không có body |

Controller/validation của Payment trả `{success, message, data, errors}`;
success trả errors null, lỗi trả data null. `data.status` và `data.method` vẫn là
object có `code`, giữ tương thích paymentApi.js hiện tại. Không đổi đường gọi FE.
401 do middleware Sanctum xử lý theo mặc định framework (chưa có global renderer
trong project). Chưa có HTTP controllers/routes Hospital/Booking trong bản checkout
này; tích hợp được kiểm thử qua BookingService thật, không tự tạo API của M4/M5.

Status HTTP: 200 đọc/process/hủy, 201 create, 401 chưa đăng nhập, 404 không tìm thấy
hoặc không thuộc user, 422 validation, 409 xung đột trạng thái/hết hạn. Exception
`App\Exceptions\Payment\SlotHoldExpiredException` kế thừa BusinessException,
status 409; PaymentController xử lý cục bộ, không sửa global exception handler.

## Kiểm thử

PaymentWorkflowTest sử dụng BookingService thật để tạo fixture Hospital. Bao phủ:
5 phương thức, phí M5 -> Payment, idempotency, biên deadline, cleanup nhiều lần,
failed/cancelled/no-payment, slot blocked, deadline null, retry không gia hạn,
gateway disabled, quyền sở hữu, stale model, payload giả mạo, validation/API alias,
đặt lại sau hết hạn và rollback khi lỗi ghi booking/slot.

Chạy an toàn trên SQLite RAM bằng PowerShell từ backend (env chỉ đổi trong shell):

```powershell
$env:DB_CONNECTION='sqlite'
$env:DB_DATABASE=':memory:'
$env:DB_URL=''
$env:APP_ENV='testing'
php artisan test --filter=Payment
```

Regression suite có thể chạy với filter loại riêng
`test_concurrency_pessimistic_locking_prevents_overbooking`, vì test đó dùng trực
tiếp hai connection MySQL. SQLite không xác minh SELECT FOR UPDATE; cần chạy thêm
trên database MySQL test riêng trước khi khẳng định an toàn concurrent requests.
Không chạy RefreshDatabase trên database dev/thật. Không sửa phpunit.xml của nhóm.
