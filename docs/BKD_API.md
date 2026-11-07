# BKD API và hợp đồng tích hợp Sprint 4

Ngày cập nhật: 07/11/2026. Phạm vi: S4-32, S4-40, S4-41, S4-42, S4-43, S4-44; tài liệu rà soát S4-45 nằm trong [BKD_REVIEW.md](BKD_REVIEW.md).

## Trạng thái bàn giao

Module BKD đã có API, Form Request, Resource, kiểm tra quyền và service điều phối qua `BookingStateMachine`. Bốn interface đã bind qua `BkdServiceProvider` với adapter gọi code thật của Hiệu/Khôi/Tuấn Anh. Chưa nghiệm thu đầy đủ E01/E05/E07/E09/E14 vì còn lỗi dependencies và các gate liên quan UI/hoàn tiền thực tế trong môi trường demo. Không có dịch vụ giả được bật trong ứng dụng.

Lõi có một thay đổi đã được An cho phép: T01 dùng `context['patient_snapshot']` nếu có, còn khi thiếu key thì giữ nguyên cách dựng snapshot từ profile đang khoá. Không thay quy tắc, trạng thái, count, payment, audit hoặc chữ ký public. BKD truyền snapshot vào context trước T01, không ghi lại snapshot sau T01. Không sửa code dịch vụ của Hiệu/Khôi/Tuấn Anh, AppServiceProvider, model Slot, schema, config/medsi.php, composer.json hoặc composer.lock. Frontend có client `src/api/doctorBookingApi.js` để Quốc Huy tích hợp UI; chưa bổ sung màn hình bác sĩ.

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

## Bốn interface đã nối code thật

Namespace interface: `App\Contracts\Bkd`. Adapter: `App\Services\Bkd\Adapters`. Provider: `App\Providers\BkdServiceProvider`, đăng ký trong `bootstrap/providers.php`; không sửa `AppServiceProvider`. Không có DevStubs, mặc định mọi môi trường dùng code thật. Test doubles chỉ xuất hiện trong các test điều phối cũ; `RealServiceIntegrationTest` không mock bốn interface hoặc các dịch vụ thật.

| Interface | Adapter đã bind | Dịch vụ thật được gọi | Chuyển đổi và bảo đảm |
|---|---|---|---|
| `PatientSnapshot` | `PatientSnapshotAdapter` | `PatientProfileService::makePatientSnapshot(PatientProfile): array` | Hydrate row đang khoá thành Eloquent; gọi Hiệu, bỏ profile_id/captured_at và che bổ sung phone/CCCD/BHYT/guardian_phone. Giữ full_name, dob và thông tin giám hộ; không khôi phục chữ số đã che |
| `BookingPayment` | `BookingPaymentAdapter` | `PaymentService::create(Booking): object` | Bỏ giá trị trả về để khớp void. Tái sử dụng payment đã được T01 tạo; không gọi gateway |
| `BookingTicket` | `BookingTicketAdapter` | `TicketService::issue(Booking): Ticket` | Bỏ giá trị trả về để khớp void; issue() trả lại phiếu mà T05 đã phát hành, không cấp STT mới; exception được truyền ra |
| `BookingRefund` | `BookingRefundAdapter` | `RefundService::forBookingEvent(Booking, BookingEvent, User|string, array): void` | Context lấy từ reject_reason/cancel_reason/cancel_reason_code của booking; dùng actor và cùng ref booking-event của dịch vụ thật để không tạo trùng |

**Điểm gọi đã có trong main:** T01 gọi PaymentService; T05 gọi TicketService; T06/T08/T10 gọi RefundService ngay trong transaction của lõi. Adapter vẫn chuyển tiếp vào đúng các hàm idempotent đó, giữ nguyên khoá/ref nên không tạo thêm payment/ticket/refund. Các DB::transaction lồng dùng cùng kết nối; adapter không commit hoặc gọi gateway bên ngoài. Số tiền do dịch vụ Khôi tính từ DB/config.

**Luồng snapshot:** row hồ sơ đang khoá → model PatientProfile → hàm Hiệu → adapter chuẩn hoá → kiểm tra BKD → context T01 → DB lưu nguyên snapshot đã chuẩn bị. Format gốc của Hiệu còn nhiều chữ số hiện hơn BKD cho phép; adapter chỉ che thêm, giữ tối đa 3 chữ số ở đuôi còn hiện và loại metadata ngoài allowlist. Không nới lỏng kiểm tra chống chuỗi số đầy đủ kèm ký tự lạ. Người gọi không truyền context vẫn nhận đúng snapshot fallback cũ, bao gồm các luồng bệnh viện.

**Còn cần chứng minh:** T05/STT/QR và huỷ confirmed qua T10 đang bị chặn bởi JWT chưa cài; sáu trạng thái hoàn, UI và mapping AU chưa được nghiệm thu đầy đủ. RefundService thật hiện ghi requested_by = null; BKD không tự sửa trường này hoặc chính sách của Khôi.

## Kiểm thử đã chạy

Ngày 07/11/2026: PHP 8.3.33, MySQL 8.4.3/InnoDB trên instance test riêng, DB `medsi_snapshot_20261107_test`. Migrations nguyên bản chạy thành công. Không dùng database ứng dụng hay SQLite để chứng minh cạnh tranh.

Kết quả toàn bộ backend: **136 test: 116 pass, 20 fail/error, 0 skip** khi bật RUN_BKD_REVIEW_TESTS=1, RUN_BKD_MYSQL_TESTS=1 và RUN_MYSQL_CONCURRENCY_TESTS=1. Test chuyển trạng thái của An: 33 pass. Test lõi snapshot mới: 4 pass (doctor/hospital, có/không context). E13 lõi và BKD đều pass bằng hai process riêng. Test review: 3 pass.

`RealServiceIntegrationTest`: **6 pass, 4 fail**. Đã chứng minh binding thật, snapshot Hiệu có giám hộ được chuẩn hoá và lưu đúng, một payment pending tổng 220.000đ không gọi gateway, T06 requested đúng 220.000đ không trùng, T08 huỷ sớm requested đúng 200.000đ/service 0, lỗi PaymentService và RefundService thật rollback dữ liệu. Bốn test cần JWT (T05, hai nhánh T10, lỗi ký phiếu) fail rõ tại dependency, không dùng phiếu giả để báo pass.

Các lỗi còn lại từ lần merge vẫn gồm thiếu Firebase JWT và UserFactory dùng UserStatus::Active không tồn tại. Composer install không chạy được với manifest hiện tại vì bacon/bacon-qr-code yêu cầu 3.0 nhưng lock chứa 3.1.1. Không chạy composer update hoặc sửa manifest/lock để né lỗi này. Cần người phụ trách sửa mismatch rồi cài dependencies, sau đó chạy lại toàn bộ test.

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
$env:RUN_BKD_REVIEW_TESTS = '1'
php vendor/bin/phpunit
```

APP_KEY cần hợp lệ để test trang web mặc định hiện có chạy. Cài dependencies bằng `composer install` trước. Các test API BKD tự rollback fixture; test concurrency tự dọn fixture của nó. Không chạy reset schema trên DB có dữ liệu cần giữ.

## Gate nghiệm thu

| Kịch bản | Phần đã kiểm thử BKD | Còn cần để nghiệm thu E2E |
|---|---|---|
| E01 đến duyệt | T01 snapshot/payment thật, callback QR giả lập nội bộ của Khôi đưa sang pending_approval, scoped list/detail | Cài được JWT, chạy T05/phiếu thật và UI; không đánh dấu đạt bước duyệt khi JWT còn thiếu |
| E05 | T06 + RefundService thật: một requested 220.000đ, trả chỗ, payment chưa được đánh dấu đã hoàn; lỗi refund rollback | Admin approved → processing → succeeded và đối chiếu AU |
| E07 | T08 đã kiểm tra requested 200.000đ/service 0; test điều phối mốc 24 giờ đã có | Nhánh confirmed T10/phiếu cancelled cần JWT; xác minh vòng đời hoàn và AU |
| E09 | Đã bind RefundService/TicketService; có test điều phối bác sĩ nghỉ | Test tích hợp T10/phiếu thật/blocked/220.000đ cần JWT, sau đó đối chiếu AU |
| E13 | Lõi và BKD: hai process, một thắng, một SE001 | Race test BKD hiện dùng test adapter cho snapshot/payment; cần thêm bằng chứng cạnh tranh toàn luồng với adapter production và nhóm xác nhận |
| E14 | Huỷ cũ/tạo mới độc lập có test điều phối, payment thật đã được kiểm tra riêng | UI, phiếu, thanh toán mới và hoàn tiền cũ đầy đủ sau khi xử lý dependencies |

Auth/login, job T03/T07, demo Admin, UI bác sĩ, callback, ticket và refund console vẫn thuộc các thành viên đã phân công trong Plan. Code thật đã được merge và BKD nối qua adapter; các gate chưa pass ở trên vẫn phải được kiểm chứng trước khi nghiệm thu. Đối chiếu audit lõi và bkd.slot.* với AU catalog của Công.
