# Biên Bản Họp Sprint 4 & Nhật Ký Phỏng Vấn Người Dùng (CMN_MIN) - MedSi

- **Mã việc:** S4-14
- **Thực hiện:** Công (Thư ký Sprint & Phụ trách Luồng Xác thực/Admin)
- **Dự án:** MedSi - Hệ thống đặt lịch khám trực tuyến

---

## PHẦN 1: BIÊN BẢN HỌP HÀNG NGÀY (DAILY STANDUP MINUTES - CMN_MIN)

### 1. CMN_MIN_01 (Ngày 1 - Khởi động Sprint 4 & Thống nhất Baseline)
- **Thời gian & Địa điểm:** 08:30 - 08:45, Phòng họp trực tuyến MedSi.
- **Thành viên tham dự:** An (Team Lead), Công, Hiệu, Hoàng Huy, Hoài Bảo, Tuấn Anh, Khôi, Quốc Huy (Đủ 8 thành viên).
- **Nội dung cuộc họp:**
  - An công bố Baseline v0.1 và schema SQL v1.1 là nguồn sự thật duy nhất. Toàn bộ 59 xung đột (CF-01 đến CF-59) đã chốt theo quyết định DL-01 đến DL-26.
  - Phân công nhiệm vụ: Hoài Bảo (Đặt lịch bác sĩ), Tuấn Anh (Đặt lịch bệnh viện & Phiếu khám), Hiệu (Hồ sơ & Consent), Công (Xác thực, AuditLogger, Scheduler, Admin overrides), Hoàng Huy (Danh mục & Báo cáo), Khôi (Thanh toán & Hoàn tiền), Quốc Huy (Frontend tích hợp).
  - Thống nhất quy ước: Bảng số nhiều (`bookings`, `payments`), trạng thái chữ thường, chuyển trạng thái qua `BookingStateMachine`.
- **Trở ngại (Blockers):** Không có.

### 2. CMN_MIN_02 (Ngày 2 - Hoàn thiện Nền tảng Migration & Mô hình RBAC)
- **Thời gian & Địa điểm:** 08:30 - 08:45, Trực tuyến.
- **Thành viên tham dự:** Đủ 8 thành viên.
- **Nội dung cuộc họp:**
  - An đã hoàn thành `S4-01` (Migration 14 bảng trên MySQL 8.0 với các ràng buộc CHECK và FK RESTRICT) và `S4-02` (Hệ thống Enum & `config/medsi.php`).
  - Công trình bày thiết kế `AuditLogger` (S4-06) với danh mục 20 sự kiện AU-01..AU-20, cơ chế tự động che CCCD, mật khẩu, QR token.
  - Hiệu hoàn thành model quan hệ Eloquent cho hồ sơ bệnh nhân.
- **Quyết định chốt:** Giữ nguyên múi giờ hệ thống `Asia/Ho_Chi_Minh` và tiền tệ VND số nguyên `DECIMAL(12,0)`.

### 3. CMN_MIN_03 (Ngày 3 - Xử lý Khóa Slot, Concurrency & Scheduler)
- **Thời gian & Địa điểm:** 08:30 - 08:45, Trực tuyến.
- **Thành viên tham dự:** Đủ 8 thành viên.
- **Nội dung cuộc họp:**
  - An hoàn thành `BookingStateMachine` (S4-04) hỗ trợ T01-T16 với cơ chế `lockForUpdate` chống overbooking.
  - Công triển khai Job định kỳ `ProcessBookingExpiriesJob` (S4-05) xử lý T03 (hết hạn giữ chỗ 15 phút, tính 5 phút grace nếu giao dịch đang pending), T07 (hết hạn duyệt 30 phút tự tạo refund), và phát hiện đủ điều kiện No-Show.
  - Hoài Bảo và Tuấn Anh bắt đầu tích hợp luồng đặt lịch theo StateMachine.
- **Trở ngại đã gỡ:** An và Công thống nhất cơ chế idempotency cho T03 và T07 để không trừ thừa `booked_count` khi job chạy lặp.

### 4. CMN_MIN_04 (Ngày 4 - Bảo mật Xác thực & Giới hạn Đăng nhập E16)
- **Thời gian & Địa điểm:** 08:30 - 08:45, Trực tuyến.
- **Thành viên tham dự:** Đủ 8 thành viên.
- **Nội dung cuộc họp:**
  - Công báo cáo hoàn thành Middleware và Policy (S4-10), chặn truy cập chéo 403 giữa các vai trò. Bác sĩ không vào được admin; staff chỉ check-in trong cơ sở của mình.
  - Công hoàn thành tính năng Rate limiting 5 lần/60s, khóa tài khoản 15 phút, thu hồi token và trả về số phút còn lại (S4-11, nghiệm thu E16).
  - Khôi trình bày cấu trúc dịch vụ thanh toán và chính sách hoàn tiền 14 dòng (S4-60, S4-63).
- **Quyết định chốt:** Không tiết lộ email có tồn tại hay không trong thông báo đăng nhập sai mật khẩu.

### 5. CMN_MIN_05 (Ngày 5 - Màn hình Bác sĩ & Kích hoạt Tài khoản)
- **Thời gian & Địa điểm:** 08:30 - 08:45, Trực tuyến.
- **Thành viên tham dự:** Đủ 8 thành viên.
- **Nội dung cuộc họp:**
  - Công triển khai luồng Admin tạo tài khoản bác sĩ ở trạng thái `pending`, bắt buộc đổi mật khẩu lần đầu để chuyển thành `active` và liên kết `doctors.user_id` (S4-12, nghiệm thu E01).
  - Hoài Bảo tích hợp màn hình danh sách chờ duyệt 30 phút cho bác sĩ (S4-42).
  - Tuấn Anh hoàn thành phát hành phiếu khám kèm chữ ký JWT HMAC-SHA256 512 ký tự cho QR token (S4-52).

### 6. CMN_MIN_06 (Ngày 6 - Gộp Nhánh Thử Nghiệm & Can Thiệp Quản Trị)
- **Thời gian & Địa điểm:** 08:30 - 09:00, Trực tuyến.
- **Thành viên tham dự:** Đủ 8 thành viên.
- **Nội dung cuộc họp:**
  - Công hoàn thành các API can thiệp quản trị S4-35: Admin hủy hộ lịch dưới 24 giờ hoàn 50% phí khám, ghi nhận check-in, completed và no-show thủ công có ghi nhận lý do.
  - Nhóm tiến hành gộp thử các nhánh vào nhánh `develop`.
  - Khôi và An xác nhận test concurrency E13 đạt chuẩn trên MySQL InnoDB.
- **Kế hoạch tiếp theo:** Chuẩn bị chạy toàn diện bộ 18 kịch bản kiểm thử E2E (E01 đến E18).

### 7. CMN_MIN_07 (Ngày 7 - Nghiệm Thu Kịch Bản E2E & Đóng Sprint 4)
- **Thời gian & Địa điểm:** 14:00 - 16:30, Trực tuyến.
- **Thành viên tham dự:** Đủ 8 thành viên.
- **Nội dung cuộc họp:**
  - Chạy và đánh giá 18 kịch bản E2E:
    - E03 (Hết hạn giữ chỗ 15 phút, nhả slot): ĐẠT.
    - E06 (Hết hạn duyệt 30 phút, nhả slot, tạo yêu cầu hoàn 100%): ĐẠT.
    - E16 (Khóa tài khoản 15 phút sau 5 lần nhập sai, thu hồi token, báo số phút): ĐẠT.
    - E01, E02, E05, E08, E12, E13: Toàn bộ đều đạt theo tiêu chí nghiệm thu.
  - Công bàn giao tài liệu kỹ thuật BR-AUTH, biên bản họp và khung Chương 2.

---

## PHẦN 2: NHẬT KÝ PHỎNG VẤN NGƯỜI DÙNG (USER INTERVIEW LOGS)

### NHẬT KÝ PHỎNG VẤN SỐ 1
- **Mã hồ sơ:** UI-LOG-01
- **Thời gian:** 10:00 - 10:45, Ngày 02/11/2026.
- **Người thực hiện phỏng vấn:** Nguyễn Thành Công (Nhóm MedSi).
- **Đối tượng phỏng vấn:** Chị Lê Thị Mai (34 tuổi, Nhân viên văn phòng, Phụ huynh có 2 con nhỏ, thường xuyên đưa người nhà đi khám tại TP.HCM).
- **Mục tiêu phỏng vấn:** Đánh giá trải nghiệm thực tế về luồng đặt lịch, giới hạn an toàn bảo mật, trải nghiệm nhận thông báo khóa tài khoản và chính sách hủy lịch trước 24 giờ.
- **Tóm tắt câu hỏi & Phản hồi thực tế:**
  1. *Khi đặt lịch khám trực tuyến, điều gì khiến chị lo lắng nhất về tài khoản và thông tin cá nhân?*
     - **Phản hồi:** Tôi rất sợ bị lộ số Căn cước công dân và số điện thoại, vì hiện nay hay bị các cuộc gọi rác và lừa đảo mạo danh bệnh viện. Nếu ứng dụng có thể che bớt số CCCD và số điện thoại khi hiển thị thì tôi an tâm hơn nhiều.
  2. *Nếu chị gõ nhầm mật khẩu nhiều lần và ứng dụng khóa tài khoản 15 phút, chị cảm thấy thế nào?*
     - **Phản hồi:** Khóa 15 phút là hợp lý để phòng ngừa kẻ xấu cố dò mật khẩu của tôi. Tuy nhiên, hệ thống phải ghi rõ là tài khoản bị khóa trong bao nhiêu phút nữa thì được mở, chứ đừng chỉ ghi chung chung "bị khóa" làm tôi hoang mang không biết khi nào vào lại được.
  3. *Quy định hủy lịch trước 24 giờ được hoàn 100% phí khám, còn dưới 24 giờ chỉ hoàn 50% qua nhân viên hỗ trợ, chị thấy có phù hợp không?*
     - **Phản hồi:** Hoàn toàn chấp nhận được. Vì nếu hủy quá sát giờ khám thì bệnh viện và bác sĩ không kịp sắp xếp cho bệnh nhân khác, gây lãng phí giờ của bác sĩ. Nhưng việc cho phép gọi Admin/tổng đài hỗ trợ hủy vớt vát được 50% là rất nhân văn so với một số nơi mất trắng 100%.
- **Bài học rút ra cho MedSi:**
  - Triển khai triệt để cơ chế che số CCCD và SĐT trên giao diện hiển thị.
  - Phản hồi API khi khóa tài khoản bắt buộc trả về trường `remaining_minutes` để giao diện hiển thị đồng hồ đếm ngược cho người dùng.

---

### NHẬT KÝ PHỎNG VẤN SỐ 2
- **Mã hồ sơ:** UI-LOG-02
- **Thời gian:** 15:00 - 15:50, Ngày 04/11/2026.
- **Người thực hiện phỏng vấn:** Nguyễn Thành Công (Nhóm MedSi).
- **Đối tượng phỏng vấn:** Bác sĩ Chuyên khoa 1 Nguyễn Hoàng Dũng (42 tuổi, Chuyên khoa Nội tổng quát, đang cộng tác tại một phòng khám tư nhân tại Quận 10).
- **Mục tiêu phỏng vấn:** Khảo sát quy trình tiếp nhận lịch, thời hạn duyệt lịch 30 phút, quy trình đăng nhập đổi mật khẩu lần đầu và thao tác của bác sĩ khi có lịch đột xuất.
- **Tóm tắt câu hỏi & Phản hồi thực tế:**
  1. *Khi phòng khám tạo tài khoản bác sĩ cho anh trên hệ thống, anh mong muốn quy trình kích hoạt diễn ra như thế nào?*
     - **Phản hồi:** Thường quản trị viên cấp cho tôi một mật khẩu khởi tạo tạm thời. Khi tôi đăng nhập lần đầu tiên, hệ thống bắt buộc tôi phải đổi sang mật khẩu riêng của mình ngay lập tức thì mới cho xem lịch bệnh nhân. Như vậy vừa an toàn cho tôi, vừa đảm bảo bảo mật bệnh án.
  2. *Thời hạn 30 phút để bác sĩ duyệt lịch có gây áp lực cho anh trong giờ làm việc không?*
     - **Phản hồi:** 30 phút là vừa phải đối với lịch hẹn khám bác sĩ theo yêu cầu. Bệnh nhân cần biết sớm bác sĩ có nhận ca hay không để họ còn thu xếp đi lại. Nếu sau 30 phút tôi bận ca cấp cứu không kịp duyệt mà hệ thống tự động hủy và hoàn trả tiền cho bệnh nhân là rất chuẩn xác, tránh để người bệnh chờ đợi vô thời hạn.
  3. *Trong trường hợp bất khả kháng bác sĩ phải nghỉ đột xuất và hủy ca khám, anh cần hệ thống xử lý ra sao?*
     - **Phản hồi:** Bác sĩ hủy ca đột xuất thì bắt buộc phải nhập lý do giải thích rõ ràng. Hệ thống phải khóa ngay khung giờ khám hôm đó lại để không ai đặt tiếp, và phải hoàn trả 100% toàn bộ tiền viện phí và phí dịch vụ cho bệnh nhân để bảo vệ uy tín của bác sĩ và cơ sở.
- **Bài học rút ra cho MedSi:**
  - Quy trình Admin tạo tài khoản `pending` -> đăng nhập lần đầu bắt đổi mật khẩu thành `active` là hoàn toàn khớp với thực tiễn nghiệp vụ y tế.
  - Logic T07 (tự động hết hạn duyệt 30 phút và hoàn trả 100% tiền) cùng với logic T10 bác sĩ hủy nghỉ đột xuất (khóa slot, hoàn 100% cả 2 phí) đáp ứng trọn vẹn yêu cầu thực tế.

