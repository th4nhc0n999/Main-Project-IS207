# Bản mô tả thay đổi BKD để tách PR theo công việc

## Vấn đề và kết quả

Phạm vi S4-32, S4-40–S4-45 bổ sung API slot bác sĩ và luồng tạo, đọc, duyệt, từ chối, huỷ lịch qua BookingStateMachine; kiểm soát quyền sở hữu, retry, version và rollback khi tích hợp lỗi. Frontend đã có API client BKD; chưa làm UI S4-73.

Bốn interface snapshot/payment/refund/ticket đã bind qua BkdServiceProvider với adapter gọi PatientProfileService của Hiệu, PaymentService/RefundService của Khôi và TicketService của Tuấn Anh. Không có DevStubs. Adapter tái sử dụng các thao tác idempotent của dịch vụ thật, không gọi gateway trong transaction. Chi tiết binding và gate nghiệm thu nằm trong [BKD_API.md](BKD_API.md).

An đã cho phép sửa tối thiểu T01: dùng context['patient_snapshot'] nếu có; thiếu key thì giữ nguyên cách dựng snapshot cũ cho luồng bệnh viện. BKD gọi adapter snapshot trước T01, che bổ sung định danh/điện thoại kể cả giám hộ rồi truyền context; không ghi lại snapshot sau T01. Không đổi quy tắc, trạng thái, count, payment, audit hay chữ ký public; không sửa dịch vụ của các thành viên, schema, Slot model, config/medsi.php hoặc composer.json/lock.

Khi merge origin/main, giữ nội dung/thứ tự route main, chỉ thêm dấu đóng nhóm bệnh viện còn thiếu ngay sau route tickets/check-in; nhóm BKD nằm cuối file sau PAY với middleware riêng. Đã kiểm tra cú pháp, danh sách API và không trùng method + đường dẫn; auth/login công khai, route bệnh viện được bảo vệ bởi auth:sanctum + EnsureActiveBookingAccount. Chưa đổi middleware BKD sang middleware của Công.

## Tách việc trước khi gửi review

| PR/mã | Nội dung | Gợi ý commit |
|---|---|---|
| S4-40 | Xem/tạo/sửa slot bác sĩ, không giao giờ, 30 phút/capacity 1 | `feat(bkd): add doctor slot APIs` |
| S4-32 | Admin khoá/sửa có kiểm tra lịch giữ, audit slot | `feat(bkd): guard admin doctor slot changes` |
| S4-41 | T01 nhận snapshot đã chuẩn bị; adapter snapshot/payment thật, retry theo tài khoản, profile conflicts | `feat(bkd): add doctor booking creation contract` |
| S4-42 | Scoped list/detail, deadline/version, T05/T06, adapter ticket/refund thật | `feat(bkd): add doctor booking decisions` |
| S4-43 | T10 bác sĩ nghỉ có lý do, slot blocked, yêu cầu refund qua dịch vụ thật | `feat(bkd): add emergency doctor cancellation` |
| S4-44 | Bệnh nhân T04/T08/T10, mốc 24 giờ, huỷ rồi đặt mới | `feat(bkd): add patient doctor booking cancellation` |
| S4-45 | API contract và sổ rà soát BR/OQ/sơ đồ/phỏng vấn | `docs(bkd): record integration and document review` |

Các file nền BKD middleware/requests/resources/service dùng chung giữa các việc cần sắp thứ tự khi tách PR. Đây là bản mô tả để review; chưa tạo PR hoặc push. S4-45 còn các việc thực tế nêu trong [BKD_REVIEW.md](BKD_REVIEW.md).

Hai commit local mới nhất:

- `660fe87` — `feat(core): allow T01 to accept prepared patient snapshot`: chỉ BookingStateMachine và test lõi snapshot.
- `ce177bf` — `feat(bkd): bind real services and pass prepared snapshots to T01`: adapter/provider BKD, luồng snapshot, test tích hợp và tài liệu.

## Validation ngày 07/11/2026

- PHP 8.3.33; migrations nguyên bản thành công trên MySQL 8.4.3/InnoDB test riêng `medsi_snapshot_20261107_test`.
- Lần chạy toàn bộ backend với RUN_BKD_REVIEW_TESTS=1, RUN_BKD_MYSQL_TESTS=1, RUN_MYSQL_CONCURRENCY_TESTS=1 và APP_KEY test hợp lệ: **136 test: 116 pass, 20 fail/error (14 error + 6 failure), 0 skip**. Đây là kết quả đã ghi nhận trước đợt phân loại lỗi; đợt phân loại chỉ chạy lại ba file bệnh viện/concurrency bên dưới.
- Test lõi của An: 33 pass; test snapshot mới: 4 pass cho doctor/hospital có hoặc không có context; test review: 3 pass. E13 lõi và BKD pass bằng hai process riêng.
- RealServiceIntegrationTest không mock bốn interface: **6 pass, 4 fail**. Đã kiểm chứng snapshot Hiệu gồm giám hộ đã che, một payment pending tổng 220.000đ, T06 requested 220.000đ, T08 requested 200.000đ/service 0 và rollback khi PaymentService/RefundService lỗi. Bốn test cần JWT chưa chạy tới kiểm tra nghiệp vụ đầy đủ.
- Một số test điều phối/race BKD vẫn dùng test double. Không coi kết quả này là bằng chứng cổng thanh toán, hoàn tiền thực tế, QR/STT hoặc UI đã đạt E2E.

### Phân loại 20 lỗi và đối chiếu main

| Nhóm | Số test lỗi | Căn cứ và đầu mối đề xuất |
|---|---:|---|
| A — Có sẵn trên main | 2 | E15/E17: UserFactory.php:25 gọi UserStatus::Active, trong khi enum khai báo ACTIVE. Factory/enum giống main; Hiệu xử lý |
| B — Dependency thiếu/lệch | 18 | 4 DoctorBookingApiTest, 4 RealServiceIntegrationTest, 8 HospitalBookingTicketTest và 2 HospitalTicketConcurrencyTest: thiếu Firebase JWT hoặc lỗi kéo theo trước khi gọi adapter. Tuấn Anh làm đầu mối dependency phiếu/QR |
| C — Thay đổi T01/BKD/routes merge | 0 xác định | Chưa có bằng chứng trong 20 lỗi; cần chạy lại sau khi xử lý dependency |
| D — Test tích hợp BKD/fixture sai | 0 xác định | Bốn test tích hợp dừng ở kiểm tra dependency có chủ đích; chưa có căn cứ kết luận test/fixture sai |

Đã tạo worktree detached từ origin/main `4991c25`, dùng cùng DB test và bản sao vendor local, chạy đúng HospitalBookingTicketTest.php, HospitalTicketConcurrencyTest.php và BookingConcurrencyTest.php với RUN_MYSQL_CONCURRENCY_TESTS=1:

| Phiên bản | Pass | Fail/error | Skip |
|---|---:|---:|---:|
| Main gốc `4991c25` | 0 | 19 error | 0 |
| Local `ce177bf`, cùng 19 test | 9 | 10 (9 error + 1 failure) | 0 |

Main gốc bị chặn khi bootstrap bởi `Unclosed '{' on line 21` trong routes/api.php; chưa tới bước JWT. Đây là lỗi main ngoài danh sách 20 lỗi local, đã được sửa khi merge theo yêu cầu. Không dùng lần chạy này để khẳng định main có cùng thông báo JWT ở runtime. Các file ký QR, factory/enum, Composer và test bệnh viện/concurrency không thay đổi giữa main và local. Worktree tạm đã xoá, nhánh hiện tại không đổi; không sửa source trong đợt phân loại.

firebase/php-jwt đã có trong manifest/lock (lock v7.2.1) nhưng thiếu trong vendor hiện tại. bacon/bacon-qr-code yêu cầu đúng 3.0 trong composer.json nhưng lock là v3.1.1, chặn composer install. Chưa có test nào trong 20 lỗi trực tiếp báo lỗi Bacon. Không chạy composer update hoặc sửa manifest/lock; cần thống nhất dependency rồi cài và chạy lại toàn bộ test. Không đưa thông tin đăng nhập DB vào tài liệu/Git.

## Kịch bản nghiệm thu liên quan

E01 đến duyệt, E05, E07, E09, E13, E14. Chi tiết phần đã chứng minh và gate còn thiếu ở [BKD_API.md](BKD_API.md). Dịch vụ thật đã được nối; chưa đánh dấu đạt E2E khi JWT, UI và vòng đời hoàn tiền thực tế chưa được kiểm chứng đầy đủ.

## Cần review trước khi tích hợp

1. Tuấn Anh/nhóm phụ trách dependency: thống nhất manifest/lock, cài JWT rồi chạy lại T05, T10, QR/STT và các test rollback ký phiếu; Hiệu sửa enum trong UserFactory. Không đổi dependency để né lỗi test.
2. An/Hiệu/Khôi/Tuấn Anh: review binding thật và thay đổi T01 đã được cho phép; Payment/Ticket/Refund tái sử dụng thao tác idempotent có sẵn trong lõi. Hoàn thiện bằng chứng E2E sau khi xử lý dependency; không xem requested là đã hoàn tiền.
3. Công: đối chiếu audit action Txx của lõi và bkd.slot.* với AU catalog; auth middleware dùng Sanctum và chỉ áp dụng cho route BKD.
4. Quốc Huy: kết nối doctorBookingApi.js, UI loading/error, countdown theo timestamp, giữ request_key khi retry và tải lại version khi conflict.
5. Hoài Bảo/An: chốt các OQ và mã UC mâu thuẫn; hoàn thiện nguồn tài liệu/phỏng vấn trước khi nghiệm thu S4-45.
