# BKD API và hợp đồng tích hợp Sprint 4

Ngày cập nhật: 06/11/2026. Phạm vi: S4-32, S4-40, S4-41, S4-42, S4-43, S4-44; tài liệu rà soát S4-45 nằm trong [BKD_DOCUMENT_REVIEW.md](BKD_DOCUMENT_REVIEW.md).

## Trạng thái bàn giao

Module BKD đã có API, Form Request, Resource, kiểm tra quyền và service điều phối qua `BookingStateMachine`. Theo lựa chọn của Hoài Bảo, bốn dịch vụ bên ngoài chỉ có interface; chưa đăng ký adapter production. Vì vậy chưa nghiệm thu đầy đủ E01/E05/E07/E09/E14. Không có dịch vụ giả được bật trong ứng dụng.

Không sửa model dùng chung `Slot`, state machine, schema, config, cơ chế auth hay giao diện dùng chung. Chỉ bổ sung route ở cuối `routes/api.php`. Frontend có client `src/api/doctorBookingApi.js` để Quốc Huy tích hợp UI; chưa bổ sung màn hình bác sĩ.

## Cách gọi

Base URL: `/api`. Ngày request: `YYYY-MM-DD`; giờ tạo/sửa slot: `HH:mm`; timestamp response có timezone. Giờ nghiệp vụ là `Asia/Ho_Chi_Minh`.

Các API có quyền dùng guard Sanctum hiện có (Bearer token hoặc phiên Sanctum do module auth cung cấp). Không có endpoint đăng nhập/token mới trong BKD. Tài khoản phải có trạng thái `active`.

| Method | Đường dẫn | Quyền | Dữ liệu |
|---|---|---|---|
| GET | `/doctors/{doctor}/slots?date=2030-01-02` | Công khai | Bắt buộc ngày; chỉ trả slot chưa qua giờ bắt đầu |
| POST | `/doctor/slots` | Bác sĩ | `work_date`, `start_time` |
| PUT | `/doctor/slots/{slot}` | Bác sĩ sở hữu | `work_date`, `start_time` |
| PUT | `/admin/doctor-slots/{slot}` | Admin | `work_date`, `start_time` |
| POST | `/admin/doctor-slots/{slot}/block` | Admin | Không có body bắt buộc |
| POST | `/doctor-bookings` | Bệnh nhân | `doctor_id`, `slot_id`, `patient_profile_id`, `request_key`, `symptoms` tuỳ chọn |
| GET | `/patient/doctor-bookings` | Bệnh nhân | Lịch của tài khoản; lọc `date`, `status`, `page`, `per_page` |
| GET | `/doctor/bookings` | Bác sĩ | Lịch của bác sĩ; cùng bộ lọc; dùng `status=pending_approval` cho hàng chờ |
| GET | `/doctor-bookings/{booking}` | Chủ lịch/bác sĩ của lịch | Đọc lại sau reload hoặc lỗi phiên bản |
| POST | `/doctor/bookings/{booking}/approve` | Bác sĩ của lịch | `version` |
| POST | `/doctor/bookings/{booking}/reject` | Bác sĩ của lịch | `version`, `reason` |
| POST | `/doctor-bookings/{booking}/cancel` | Chủ lịch/bác sĩ của lịch | `version`, `reason`, `reason_code` tuỳ chọn |

Admin override duyệt thuộc module demo; route BKD này chỉ cho bác sĩ duyệt. Staff không có quyền huỷ.

Slot tạo dài 30 phút, capacity 1, specialty lấy từ bác sĩ đăng nhập. Client không được gửi owner/specialty/capacity/count/status. Không nhận slot qua nửa đêm vì schema dùng giờ bắt đầu < giờ kết thúc cùng ngày. Slot giao giờ bị chặn, kể cả start_time khác nhau; hai khoảng sát nhau được phép.

Danh sách giữ cả slot full/blocked chưa qua để UI thể hiện tình trạng; `can_book` chỉ true nếu available, còn chỗ và thoả hạn 2 giờ–30 ngày. `remaining_places` thể hiện sức chứa còn lại, không phải quyền đặt. Mọi yêu cầu đặt vẫn kiểm tra lại dưới khoá.

Sửa slot bị chặn khi `booked_count > 0` hoặc có booking active (`pending_payment`, `pending_approval`, `confirmed`, `checked_in`). Khoá slot chỉ chặn nhận mới, giữ nguyên các booking đã có; không tự huỷ hàng loạt hoặc mở lại slot. Nghỉ đột xuất qua API huỷ booking confirmed sẽ khoá slot bị ảnh hưởng theo lõi hiện tại.

## Response

Mọi response của các endpoint BKD theo envelope:

```json
{
  "success": true,
  "message": "Thành công.",
  "data": {}
}
```

Lỗi có `success=false`, `data=null`, thêm `code`, có thể thêm `errors` theo field. Không trả model nguyên vẹn, SQL, snapshot hay thông tin đăng nhập.

| HTTP | Code điển hình | Ý nghĩa |
|---|---|---|
| 401 | `UNAUTHENTICATED` | Chưa đăng nhập |
| 403 | `FORBIDDEN` | Sai vai trò, tài khoản không active hoặc không sở hữu |
| 404 | `NOT_FOUND`/`HTTP_ERROR` | Không tìm thấy dữ liệu hợp lệ |
| 409 | `SE001` | Slot giao giờ/hết chỗ/không khớp hoặc hồ sơ có lịch xung đột |
| 409 | `IDEMPOTENCY_CONFLICT` | Cùng request_key nhưng khác nội dung |
| 409 | `STALE_VERSION` | Booking đã thay đổi; tải lại trước khi thao tác tiếp |
| 409 | `BKD_CONFLICT` | Slot đang giữ, trạng thái không hợp lệ hoặc quá hạn duyệt |
| 422 | `VALIDATION_ERROR`/`INVALID_BOOKING_TRANSITION` | Đầu vào, hạn đặt, consent, giới hạn lịch hoặc điều kiện chuyển không hợp lệ |
| 503 | `BKD_INTEGRATION_UNAVAILABLE` | Chưa bind adapter hoặc snapshot không đúng hợp đồng |
| 500/503 | `BKD_UNAVAILABLE`/`DATABASE_UNAVAILABLE` | Lỗi hạ tầng/adapter; không trả chi tiết nội bộ |

Các code ngoài `SE001` là định danh lỗi kỹ thuật của module, không tự gán thành danh mục nghiệp vụ SE002–SE007. `reason_code` chỉ kiểm tra định dạng/độ dài vì chưa có catalog được duyệt.

Tạo lịch trả HTTP 200 cho cả lần đầu và retry. Tạo slot trả 201. Danh sách booking trả `data.items`, `data.pagination`, `data.server_time`. Booking có `hold_expires_at`, `approval_expires_at`, `approval_seconds_remaining`, `version`, slot và thông tin số tiền. Dùng deadline/server_time để UI đếm ngược; server quyết định hạn. Resource chỉ trả tên người khám từ snapshot, không trả các trường định danh/điện thoại.

## Chống lặp và transaction

- `request_key` bắt buộc, tối đa 64 ký tự chữ/số/`_`/`-`; frontend tạo một key cho một lần đặt và giữ nguyên khi retry. So sánh doctor, slot, profile và symptoms. Tạo lịch mới sau huỷ/đổi phải dùng key mới.
- Khoá tài khoản trước khi tra request_key để tuần tự hoá retry qua các profile/slot; tiếp theo slot, hồ sơ và lõi T01. Kiểm tra xung đột theo profile, không theo tài khoản.
- Mutation khoá slot rồi booking theo thứ tự của state machine, so sánh `version`. API không trực tiếp sửa status/count của booking.
- Approval/rejection chỉ nhận khi pending_approval và `now < approval_expires_at`, kể cả T06. Cùng thời điểm hết hạn không cho bác sĩ quyết định.
- Bệnh nhân huỷ pending_payment qua T04 không cần adapter hoàn; pending_approval qua T08, confirmed qua T10. T08/T10 của bệnh nhân chịu hạn từ 24 giờ; đúng 24 giờ được phép. Bác sĩ chỉ dùng T10 cho nghỉ đột xuất và bắt buộc lý do.
- Lỗi adapter phải ném exception: rollback cả booking, payment, count, phiếu và audit trong transaction. Không gọi cổng ngoài hoặc commit trong adapter. Nếu bên tích hợp cần xử lý bất đồng bộ, phải chốt cơ chế bền vững trước khi thay hợp đồng.

## Bốn interface chờ tích hợp

Namespace: `App\Contracts\Bkd`. Adapter production được chủ module đăng ký vào Laravel container sau review; BKD không bind mặc định. Test doubles chỉ xuất hiện trong `tests`.

| Interface | Hàm | Hợp đồng |
|---|---|---|
| `PatientSnapshot` | `makePatientSnapshot(object $profile): array` | Hiệu trả JSON đã che; có full_name; chỉ các trường hồ sơ trong allowlist của service. Phone/CCCD/BHYT/guardian_phone phải đã che. Không lưu snapshot client gửi |
| `BookingPayment` | `ensurePendingPayment(Booking $booking): void` | Khôi nối PaymentService; tái sử dụng và kiểm tra dòng payment hiện tại, không tạo dòng thứ hai, không gọi gateway tại đây |
| `BookingTicket` | `issueFor(Booking $booking): void` | Tuấn Anh phát hành một phiếu issued/STT/JWT sau T05, cùng transaction; có lỗi phải ném exception |
| `BookingRefund` | `requestFor(Booking $booking, BookingEvent $event, User $actor): void` | Khôi tạo đúng một requested theo T06/T08/T10, actor và chính sách baseline; không đánh dấu tiền đã hoàn |

**Điểm cần review với An/Khôi:** lõi đang tự insert payment trong `createPendingPayment`. Vì Hoài Bảo chọn không sửa phần dùng chung, interface sử dụng cách handoff/adopt dòng đã tạo. Muốn PaymentService là nơi duy nhất tạo payment phải phối hợp đổi điểm gọi trong lõi; không gọi hai nơi cùng insert. Phí 200.000đ + 20.000đ = 220.000đ hiện do lõi tính từ DB/config.

**Trách nhiệm adapter chưa được chứng minh:** số tiền/chính sách refund; sáu trạng thái hoàn; giao dịch cổng; chữ ký/STT/QR thực; mapping AU; consent CRUD/masking của Hiệu. Adapter no-op sẽ không đáp ứng hợp đồng và không được coi là tích hợp thành công.

## Kiểm thử đã chạy

Ngày 06/11/2026: PHP 8.3.33, MySQL 8.4.3/InnoDB trên instance test riêng, DB `medsi_bkd_test`. Migrations nguyên bản chạy thành công. Không dùng database ứng dụng hay SQLite để chứng minh cạnh tranh.

Kết quả toàn bộ backend: **55 tests, 237 assertions, không skip**, khi bật hai cờ test. Trong đó 18 test API BKD dùng test doubles cho các dependency và một test cạnh tranh BKD dùng hai process/kết nối DB độc lập. Test E13 của lõi cũng chạy.

Kiểm tra đã có: slot quá giờ/đầy/quyền tạo/khoá/sửa, server price, snapshot, retry/key khác nội dung, consent/hồ sơ người khác, 2 giờ/30 ngày, giao giờ khác khoa, cùng khoa cùng ngày, tối đa 3 lịch, owner doctor, version/deadline, rollback payment/refund/ticket, huỷ đúng 24 giờ/dưới 24 giờ, nghỉ bác sĩ, huỷ chưa trả và huỷ rồi đặt mới. **Không suy từ kết quả này rằng các E2E thanh toán/hoàn/QR thực đã đạt.**

Để chạy trên database MySQL test đã migrate, tên kết thúc `_test`, từ `backend` trong PowerShell:

```powershell
$env:DB_CONNECTION = 'mysql'
$env:DB_HOST = '127.0.0.1'
$env:DB_PORT = '<cổng MySQL test>'
$env:DB_DATABASE = '<database kết thúc _test>'
# DB_USERNAME/DB_PASSWORD và APP_KEY lấy từ môi trường test của bạn; không đưa lên Git.
$env:RUN_BKD_MYSQL_TESTS = '1'
$env:RUN_MYSQL_CONCURRENCY_TESTS = '1'
php vendor/bin/phpunit
```

APP_KEY cần hợp lệ để test trang web mặc định hiện có chạy. Cài dependencies bằng `composer install` trước. Các test API BKD tự rollback fixture; test concurrency tự dọn fixture của nó. Không chạy reset schema trên DB có dữ liệu cần giữ.

## Gate nghiệm thu

| Kịch bản | Phần đã kiểm thử BKD | Còn cần để nghiệm thu E2E |
|---|---|---|
| E01 đến duyệt | T01, scoped list/detail, T05, rollback khi phiếu lỗi | Adapter snapshot/payment/phiếu, QR payment thật của môi trường demo và UI |
| E05 | T06, lý do, trả chỗ, gọi adapter, rollback và chống gọi lặp | Refund requested → approved → processing → succeeded, đúng 220.000đ và AU |
| E07 | Huỷ đúng mốc 24 giờ, phiếu cancelled, trả chỗ | Refund 200.000đ, service 0đ, payment vẫn paid và AU |
| E09 | Bác sĩ huỷ đúng lịch, slot blocked và phiếu cancelled | Refund 220.000đ và audit theo AU catalog |
| E13 | Lõi và BKD service: hai process, một thắng, một SE001 | Adapter production và xác nhận nhóm cho kết quả tích hợp cuối |
| E14 | Huỷ cũ/tạo mới độc lập, payment mới 220.000đ trong test module | UI, payment mới và refund cũ qua dịch vụ production |

Auth/login, job T03/T07, demo Admin, UI bác sĩ, callback, ticket và refund console vẫn thuộc các thành viên đã phân công trong Plan. Chốt hợp đồng AU với Công: lõi hiện ghi action Txx; slot service ghi `bkd.slot.created/updated/blocked`, chưa tự nhận là các mã AU đã nghiệm thu.
