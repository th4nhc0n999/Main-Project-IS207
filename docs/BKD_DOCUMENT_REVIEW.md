# Rà soát tài liệu BKD cho S4-45

Ngày 06/11/2026. Nguồn: Plan.md; baseline v0.1 mục 1–5; medsi_schema_v1.sql; BKD_DOC.docx; BKD_STM_Bang_chuyen_trang_thai.docx; workbook BKD_SCHED_BKD_BR_BKD_CMP_BKD_OQ.xlsx và sáu hình ACT/SEQ/STM do Hoài Bảo cung cấp. Đây là sổ đối chiếu và nội dung cần đồng bộ, không giả lập phê duyệt hay phỏng vấn.

## Nội dung áp dụng cho triển khai BKD

| Chủ đề | Nội dung thống nhất | Tài liệu cần đồng bộ |
|---|---|---|
| Slot | Bác sĩ tạo của mình, 30 phút, capacity 1, specialty theo bác sĩ; Admin khoá; chặn sửa khi có lịch giữ | SCHED, BR-12/13/22, ACT_03 |
| Đặt | 2 giờ–30 ngày; không giao giờ/cùng khoa cùng ngày; tối đa 3 lịch hiệu lực mỗi profile | BR-02/05, OQ-01/06, ACT_01 |
| Giữ | 15 phút, thêm 5 phút chỉ khi giao dịch chưa rõ/pending; retry không gia hạn | SCHED C8/C39, BR-06/07, OQ-02, CMP F12, DOC mục duyệt, ACT_01, SEQ_01, STM T01/T03 |
| Duyệt | Sau trả tiền, bác sĩ của lịch duyệt trong 30 phút; từ chối có lý do; quá hạn expired, yêu cầu hoàn 100% hai phí; Admin override chỉ demo | BR-09/10/11/16, OQ-03, ACT_02, STM T05–T07 |
| Huỷ | Chưa trả: T04; đã trả từ 24 giờ: hoàn phí khám 100%, service 0; dưới 24 giờ qua Admin hoàn phí khám 50% | BR-17/18, OQ-05, STM T04/T08/T10 |
| Nghỉ | Bác sĩ huỷ confirmed của mình, có lý do; slot bị ảnh hưởng blocked, hoàn cả hai phí | ACT_03, OQ-13, STM T10 |
| Đổi | Huỷ lịch cũ rồi đặt mới, thanh toán mới, không sửa slot_id của lịch cũ | BR-23, E14 |
| Check-in | Staff đúng cơ sở hoặc Admin | OQ-07, STM T09, hình STM |
| Hoàn thành | Bác sĩ của lịch hoặc Admin | OQ-07, STM T12, hình STM |
| No-show | Start slot bác sĩ +15 phút; hệ thống đánh dấu đủ điều kiện, Admin xác nhận; phiếu expired, hoàn 0 | BR-25, OQ-09, STM T11 |
| Count | Chỉ giảm khi pending_payment/pending_approval/confirmed sang expired/rejected/cancelled; T11/T12/T13 giữ nguyên | STM, SCHED phần phân bổ |
| Mã | Hết chỗ/đặt trùng SE001; không dùng mã ví dụ ngoại lệ ngày làm mã lỗi API | SCHED A46:A52; ACT/SEQ và Plan mục mã lỗi |
| Dữ liệu | bookings/slots/payments; giờ slot địa phương; trạng thái chữ thường; slot available/full/blocked | DOC ERD đề xuất, SCHED dữ liệu, mọi hình STM |

BR-02/05/06/17/25 trong workbook đã được sửa ở một số ô nhưng còn nhãn Draft/các ghi chú cũ; không cần viết lại về giá trị cũ để sửa tiếp. SCHED vẫn giữ nhiều ví dụ 10 phút nên phải cập nhật đồng bộ tham số, công thức và văn bản. Không sửa các câu nhận xét đối thủ thành chính sách MedSi nếu không có nguồn tương ứng.

## Danh sách 15 OQ để Hoài Bảo gửi xác nhận

Tất cả vẫn Open trong workbook gốc. Bảng dưới nêu căn cứ đã có và câu hỏi còn thiếu; không tự đổi trạng thái thành Resolved/Agreed.

| OQ | Căn cứ/kết luận đề nghị ghi nhận | Phần còn cần người có trách nhiệm xác nhận |
|---|---|---|
| 01 Phạm vi/hạn đặt | DL-04: bác sĩ 2 giờ–30 ngày; khám trực tiếp | Xác nhận phạm vi cơ sở theo module hiện hành |
| 02 Giữ chỗ/tiền muộn | DL-05, T03/T16: 15 phút +5 khi pending/chưa rõ; tiền muộn không hồi sinh lịch | An/Khôi/Công chốt xử lý callback ngay trong grace và ranh giới timestamp |
| 03 Người duyệt | DL-03, T02/T05/T06/T07: trả tiền rồi bác sĩ duyệt trong 30 phút; demo Admin | Hợp đồng Payment/Ticket/Refund và cách bật demo thuộc module chủ quản |
| 04 Slot/đa cơ sở | Sprint requirement: 30 phút, 1 chỗ; không trùng slot | Thời gian di chuyển/đa cơ sở, lịch tuần chưa có schema được duyệt |
| 05 Huỷ/đổi | DL-07 và 14 dòng refund policy mục 5 đã quy định tỷ lệ | Danh mục cancel_reason_code, trình tự hỗ trợ và thực thi RefundService |
| 06 Tối đa lịch | DL-06: tối đa 3 mỗi hồ sơ | Lõi đang tính checked_in; xác nhận định nghĩa chung để đồng bộ toàn nhóm |
| 07 Tiếp nhận/hoàn thành/nhắc | DL-09: staff/Admin tiếp nhận; doctor/Admin hoàn thành | Bỏ nhắc SMS/email khỏi sprint theo DL-19; không gộp quyền check-in của doctor |
| 08 Phí | DL-11: 20.000đ phí tiện ích, tiền nguyên, server tính; mục 5 tách phí hoàn | Khôi/Hoàng Huy xác nhận adapter và dữ liệu demo; phí khám không cố định 200.000đ |
| 09 No-show | DL-08 và mục 5 dòng 12: start+15, Admin xác nhận, hoàn 0 | Công/Hoàng Huy hoàn thiện job/console và audit |
| 10 Huỷ sau check-in | T13: Admin, cơ sở ngừng phục vụ, lý do; giữ count; hoàn hai phí | Cách thu bằng chứng/điều phối ngoài module BKD và không có trạng thái đang khám |
| 11 Ngoại lệ ngày | Có đề xuất CLOSED/REPLACE/ADD trong SCHED | Chưa có bảng tương ứng trong schema; xin phạm vi hoặc Change Request trước khi làm |
| 12 Ca dư/qua ngày | Đề xuất slot đủ 30 phút, không bán phần dư | Chưa có chức năng sinh lịch tuần; API hiện nhận slot từng ngày, không nhận slot qua nửa đêm |
| 13 Sửa/nghỉ đã đặt | BR-13/22; E09 khoá đúng slot bị ảnh hưởng; không tự đổi bác sĩ | SLA liên hệ, quyền mở lại slot, quy trình xử lý nhiều lịch cần nhóm chốt |
| 14 Chống lặp | Unique user_id/request_key; cùng nội dung trả cũ, khác nội dung từ chối | Chính sách lưu key và retry dài hạn; API dùng version chống mutation stale |
| 15 Nghiên cứu/phỏng vấn | CMP có URL/giới hạn; yêu cầu 2 phỏng vấn | Chưa có bằng chứng 2 phỏng vấn thật hoặc kiểm thử đối thủ; không được ghi đã hoàn tất |

## Các xung đột truy vết phải chốt

- DOC: UC-BKD-02 = duyệt, UC-BKD-03 = quản lý lịch; workbook: UC-BKD-02 = thanh toán, UC-BKD-03 = duyệt, UC-BKD-04 = lịch làm việc. Cần danh mục UC duy nhất, không tự đổi mã trong tài liệu gốc.
- SE001–SE007 tại các dòng ví dụ ngoại lệ ngày không phải bảng lỗi API; SE002–SE007 nghiệp vụ chưa có catalog đủ căn cứ.
- appointment/facility_id/slot_allocation/weekly_schedule/shift/schedule_exception chỉ là mô hình đề xuất. Không thêm migration hoặc dùng các cột đó thay schema chuẩn khi chưa có CR.
- DOC/bảng STM có T17; lõi chỉ có T01–T16/T02H. Xử lý lỗi có thể là nguyên tắc chung, chưa thêm event hoặc trạng thái mới.
- Callback dùng transaction_code unique theo DL-13, không lấy event_id trong sơ đồ làm cột mới. Khoản thu thứ hai cả khi lịch đang confirmed cũng phải được Khôi xử lý.
- File AGENTS.md hiện đã chỉ định v0.1; trong PDF cũ còn v1.0. Triển khai lần này theo v0.1 và schema hiện hành.

## Hai buổi phỏng vấn còn phải thực hiện

Hoài Bảo chủ động tổ chức, lấy đồng ý ghi nhận, dùng dữ liệu giả để trình diễn. Không coi test phần mềm hay nghiên cứu CMP là phỏng vấn.

| Buổi đề xuất | Nội dung cần hỏi | Bằng chứng phải lưu |
|---|---|---|
| 1 Bệnh nhân/người đại diện | Hiểu slot, trả tiền rồi chờ bác sĩ, hạn giữ, huỷ/đổi và khoản hoàn | Ngày, vai trò người tham gia, câu hỏi/câu trả lời, phát hiện, OQ liên quan, người xác nhận |
| 2 Bác sĩ/điều phối | Slot 30 phút, hạn duyệt, lý do từ chối, nghỉ đột xuất và lịch bị ảnh hưởng | Cùng mẫu, ghi rõ đề xuất nào phù hợp/chưa phù hợp và hành động tiếp theo |

Mẫu biên bản mỗi buổi: ngày và cách thực hiện; vai trò người tham gia; đồng ý ghi nhận; mục tiêu; từng câu hỏi và câu trả lời thực tế; quan sát; OQ/BR ảnh hưởng; đề xuất; người cần duyệt. Chưa có dữ liệu thì để trống/chưa thực hiện, không tự viết lời người được phỏng vấn.

## Trạng thái S4-45

Đã có sổ đối chiếu quy tắc, 15 OQ và chỉ dẫn đồng bộ. **Chưa hoàn tất S4-45**: chưa cập nhật bản DOCX/XLSX/PNG gốc, chưa có người xác nhận OQ/UC, chưa thực hiện hai phỏng vấn; cần hoàn thiện bản được nhóm thống nhất và review trước khi dùng làm tài liệu chính thức.
