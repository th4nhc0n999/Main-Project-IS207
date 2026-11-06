# Bản mô tả thay đổi BKD để tách PR theo công việc

## Vấn đề và kết quả

Backend trước đây chỉ có API health dù đã có state machine. Thay đổi này bổ sung API slot bác sĩ và luồng tạo, đọc, duyệt, từ chối, huỷ lịch qua lõi hiện tại; kiểm soát quyền sở hữu, retry, version và rollback khi tích hợp lỗi.

Theo yêu cầu Hoài Bảo, chỉ thêm interface cho snapshot/payment/refund/ticket, chưa triển khai hoặc bind dịch vụ của người khác. Các thao tác cần adapter trả 503 khi chưa sẵn sàng. Không thay schema, tham số, Slot model, state machine hay route của module khác. Frontend có API client BKD để tích hợp sau; chưa làm UI S4-73.

## Tách việc trước khi gửi review

| PR/mã | Nội dung | Gợi ý commit |
|---|---|---|
| S4-40 | Xem/tạo/sửa slot bác sĩ, không giao giờ, 30 phút/capacity 1 | `feat(bkd): add doctor slot APIs` |
| S4-32 | Admin khoá/sửa có kiểm tra lịch giữ, audit slot | `feat(bkd): guard admin doctor slot changes` |
| S4-41 | T01, snapshot/payment contracts, retry theo tài khoản, profile conflicts | `feat(bkd): add doctor booking creation contract` |
| S4-42 | Scoped list/detail, deadline/version, T05/T06, ticket/refund contracts | `feat(bkd): add doctor booking decisions` |
| S4-43 | T10 bác sĩ nghỉ có lý do, slot blocked, yêu cầu refund qua contract | `feat(bkd): add emergency doctor cancellation` |
| S4-44 | Bệnh nhân T04/T08/T10, mốc 24 giờ, huỷ rồi đặt mới | `feat(bkd): add patient doctor booking cancellation` |
| S4-45 | API contract và sổ rà soát BR/OQ/sơ đồ/phỏng vấn | `docs(bkd): record integration and document review` |

Các file nền BKD middleware/requests/resources/service dùng chung giữa các việc cần sắp thứ tự commit khi tách PR. Đây là bản mô tả để review, chưa có commit/PR được tạo hay push. S4-45 còn các việc thực tế nêu trong BKD_DOCUMENT_REVIEW.md.

## Validation ngày 06/11/2026

- Cài dependencies theo composer.lock, không cập nhật phiên bản.
- Migrations nguyên bản thành công trên MySQL 8.4.3/InnoDB test riêng `medsi_bkd_test`.
- `php vendor/bin/phpunit` với RUN_BKD_MYSQL_TESTS=1, RUN_MYSQL_CONCURRENCY_TESTS=1 và APP_KEY test hợp lệ: **55 tests / 237 assertions**, không skip.
- Có test API BKD cho chính sách/quyền/phiên bản/retry và rollback tại các điểm tích hợp; có race test BKD bằng hai process riêng và test race lõi.
- Adapter trong test là test double; không phải bằng chứng cổng thanh toán, hoàn tiền, QR/STT hoặc UI production đạt E2E.

## Kịch bản nghiệm thu liên quan

E01 đến duyệt, E05, E07, E09, E13, E14. Chi tiết phần đã chứng minh và gate còn thiếu ở BKD_API.md. Chưa đánh dấu pass các E2E khi còn thiếu dịch vụ thật.

## Cần review trước khi tích hợp

1. An/Khôi: state machine đang tạo payment; adapter phải adopt dòng đó, hoặc nhóm thay điểm gọi trong lõi sau review để PaymentService sở hữu duy nhất việc insert.
2. Hiệu/Khôi/Tuấn Anh: thống nhất và bind bốn interface; mọi DB side effect cùng transaction, lỗi ném exception, không commit/call gateway ngoài ở bên trong.
3. Công: đối chiếu audit action Txx của lõi và bkd.slot.* với AU catalog; auth middleware dùng Sanctum và chỉ áp dụng cho route BKD.
4. Quốc Huy: kết nối doctorBookingApi.js, UI loading/error, countdown theo timestamp, giữ request_key khi retry và tải lại version khi conflict.
5. Hoài Bảo/An: chốt các OQ và mã UC mâu thuẫn; hoàn thiện nguồn tài liệu/phỏng vấn trước khi nghiệm thu S4-45.
