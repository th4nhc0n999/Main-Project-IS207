# DANH MỤC CÂU HỎI MỞ & ĐỀ XUẤT NGHIỆP VỤ (UI_OQ)

- **Dự án:** MedSi — Đặt lịch khám bệnh trực tuyến (IS207)
- **Phân hệ:** Giao diện & Trải nghiệm Người dùng (`UI — User Interface & UX`)
- **Người thực hiện:** **Huy Nguyễn Quốc**
- **Ngày hoàn thành:** 15/10/2026
- **Số lượng:** 15 câu hỏi mở đã có phương án đề xuất mặc định

---

## 📑 1. Bảng Ma Trận 15 Câu Hỏi Mở Cần Chốt

| Mã ID | Câu hỏi mở | Đề xuất mặc định (Phương án chốt) | Lý do / Tác động kỹ thuật | BR liên quan | Người phụ trách chốt | Ưu tiên |
| :---: | :--- | :--- | :--- | :---: | :--- | :---: |
| **UI_OQ_01** | Thời gian khóa giữ slot đếm ngược là bao lâu? | **10:00 phút** | Vừa đủ quét VietQR, tránh giữ chỗ ảo làm mất slot người khác | `BR-UI-04` | Bảo (BKD), Nhóm trưởng | `High` |
| **UI_OQ_02** | Xử lý thế nào khi trình duyệt chặn Geolocation API trên HTTP? | **Chạy localhost khi dev; Fallback Dropdown Quận khi deploy** | Trình duyệt chặn GPS nếu không có SSL HTTPS | `BR-UI-09` | Nhóm trưởng | `High` |
| **UI_OQ_03** | Bác sĩ có portal đăng nhập riêng để xem lịch không? | **Không, quản lý bởi Admin trong Sprint 3** | Theo Product Brief, Bác sĩ chỉ là danh mục dữ liệu được quản lý | `BR-UI-01` | Nhóm trưởng | `Medium` |
| **UI_OQ_04** | Bệnh nhân có được đổi ca khám trực tiếp hay phải hủy đặt lại? | **Hủy đặt lại (nếu trước 2 tiếng)** | Tránh phức tạp hóa luồng giao dịch thanh toán chênh lệch giá | `BR-UI-07` | Bảo (BKD) | `Medium` |
| **UI_OQ_05** | Một tài khoản được lưu tối đa bao nhiêu hồ sơ bệnh nhân? | **Tối đa 10 hồ sơ** | Đủ cho gia đình nhiều thế hệ mà không gây nặng tải dữ liệu | `BR-UI-15` | Backend team | `Low` |
| **UI_OQ_06** | Khi thanh toán thành công, có gửi email/SMS xác nhận không? | **Giao diện hiện mã QR và tải file PDF** | Tiết kiệm chi phí cổng SMS Brandname giai đoạn đồ án | `BR-UI-19` | Nhóm trưởng | `Low` |
| **UI_OQ_07** | Bộ lọc bán kính Near-me mặc định là bao nhiêu km? | **5 km** | Khoảng cách di chuyển trung bình trong đô thị bằng xe máy | `BR-UI-23` | Nhóm trưởng | `Medium` |
| **UI_OQ_08** | Có hiển thị số lượng chỗ còn lại trong slot không? | **Có, dạng pill 'Còn X chỗ'** | Tạo tâm lý khẩn trương, minh bạch thông tin tiếp nhận | `BR-UI-01` | Bảo (BKD) | `Medium` |
| **UI_OQ_09** | Xử lý thế nào khi người dùng ấn F5 ở màn hình thanh toán? | **Lưu bookingId vào localStorage để tiếp tục đếm ngược** | Bệnh nhân không bị mất phiên thanh toán | `BR-UI-04` | Frontend team | `High` |
| **UI_OQ_10** | Bác sĩ có được cấu hình ảnh đại diện tùy chỉnh không? | **Có, Admin upload ảnh đại diện tỷ lệ 1:1** | Tăng tính nhận diện và độ tin cậy chuyên môn | `BR-UI-12` | Admin team | `Low` |
| **UI_OQ_11** | Có hỗ trợ đặt lịch khám tại Bệnh viện (Exam Types) trên cùng giao diện không? | **Có, chuyển tab Bác sĩ / Bệnh viện** | Đồng bộ với cơ sở dữ liệu owner_type đa hình | `BR-UI-01` | Bảo (BKD) | `High` |
| **UI_OQ_12** | Hạn hủy lịch 2 tiếng có áp dụng cho ca khám buổi sáng sớm (7h)? | **Có, vẫn áp dụng quy tắc 2 tiếng** | Bảo đảm tính nhất quán trên toàn hệ thống | `BR-UI-07` | Nhóm trưởng | `Medium` |
| **UI_OQ_13** | Có cần tích hợp Google Maps API không hay chỉ dùng OpenStreetMap? | **Dùng Leaflet / OpenStreetMap hoặc link Google Maps** | Không tốn chi phí thẻ visa và hạn mức quota Google | `BR-UI-10` | Nhóm trưởng | `High` |
| **UI_OQ_14** | Font chữ Plus Jakarta Sans có hỗ trợ đầy đủ tiếng Việt không? | **Có, hỗ trợ 100% Unicode tiếng Việt** | Đã kiểm nghiệm hiển thị chuẩn xác không lỗi dấu | `BR-UI-21` | Frontend team | `Medium` |
| **UI_OQ_15** | Trường triệu chứng bệnh có bắt buộc nhập không? | **Tùy chọn (Optional), tối đa 500 ký tự** | Không tạo thêm rào cản khi bệnh nhân muốn đặt nhanh | `BR-UI-15` | Nhóm trưởng | `Medium` |

---

## 🔬 2. Bốn Quyết Định Thiết Kế Cốt Lõi
1. **Khóa giữ slot 10:00 phút:** Thời gian lý tưởng để bệnh nhân mở app ngân hàng quét mã VietQR mà không giam chỗ quá lâu.
2. **Cơ chế dự phòng Fallback GPS:** Khi trình duyệt chặn quyền hoặc không có SSL, bật Modal chọn Quận/Huyện thủ công.
3. **Chính sách hủy lịch trước 2 tiếng:** Dưới 2 tiếng phải liên hệ hotline để cơ sở y tế điều phối kịp thời.
4. **Tối đa 10 hồ sơ bệnh nhân:** Đủ quản lý cho đại gia đình trong 1 tài khoản duy nhất.