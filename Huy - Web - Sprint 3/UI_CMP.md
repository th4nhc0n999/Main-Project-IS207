# SO SÁNH ĐỐI THỦ CẠNH TRANH & ĐO LƯỜNG BENCHMARK (UI_CMP)

- **Dự án:** MedSi — Đặt lịch khám bệnh trực tuyến (IS207)
- **Phân hệ:** Giao diện & Trải nghiệm Người dùng (`UI — User Interface & UX`)
- **Người thực hiện:** **Huy Nguyễn Quốc**
- **Ngày hoàn thành:** 15/10/2026
- **Điểm số tổng hợp:** **MedSi: 9.12 / 10** (Dẫn đầu so với YouMed, BookingCare, Medpro)

---

## 📑 1. Bảng Ma Trận So Sánh 12 Tiêu Chí Chi Tiết

| Mã | Tiêu chí so sánh UI/UX | MedSi (Đề xuất) | YouMed | Medpro | BookingCare | Lợi thế & Ghi chú áp dụng cho MedSi |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- |
| **CMP-01** | Số bước phễu hoàn tất đặt khám | **3 bước tinh gọn** | 5 bước | 6 bước | 4 bước | MedSi nhanh nhất, giảm tối đa tỷ lệ rớt phễu (Drop-off) |
| **CMP-02** | Tìm kiếm & Định vị Bác sĩ gần tôi (Near-me) | **Có (GPS + Haversine km)** | Chỉ theo Quận | Chỉ theo Tỉnh | Không có | MedSi tính chính xác cự ly km thực tế từ vị trí người bệnh |
| **CMP-03** | Trực quan hóa ma trận slot (Sáng / Chiều) | **Có (3 trạng thái màu)** | Có | Có | Có | MedSi phân định rõ ràng Khả dụng, Đang chọn, Đã đầy |
| **CMP-04** | Khóa giữ chỗ đếm ngược thời gian thực | **Có (10:00 phút)** | Không | Không | Không | Ngăn chặn tuyệt đối tình trạng đặt trùng lịch (Race Condition) |
| **CMP-05** | Thanh toán VietQR động khớp tiền tự động | **Có (Napas 247)** | Không | Có | Không | Quét mã chuyển khoản tức thời, không cần nhập lại số tiền |
| **CMP-06** | Quản lý nhiều hồ sơ bệnh nhân trong 1 tài khoản | **Có (tối đa 10)** | Có | Có | Hạn chế | Hỗ trợ đặt khám hộ thuận tiện cho con cái, cha mẹ |
| **CMP-07** | Skeleton Shimmer Loading khi tải dữ liệu | **Có (1.5s Shimmer)** | Có | Không (Spinner) | Không | Trải nghiệm thị giác hiện đại, mượt mà chuẩn Web 2026 |
| **CMP-08** | Thời gian tự hủy lịch linh hoạt | **Trước >= 2 tiếng** | Trước >= 24 tiếng | Rườm rà | Phải gọi điện | MedSi trao quyền chủ động cho người bệnh trước 2 tiếng |
| **CMP-09** | Phiếu khám điện tử kèm mã QR Check-in | **Có (QR tại viện)** | Có | Có | Chỉ SMS/Email | Tiếp đón nhanh tại viện không cần xuất trình giấy tờ |
| **CMP-10** | Tiêu chuẩn tiếp cận trợ năng WCAG 2.1 AA | **Đạt chuẩn (>= 4.5:1)** | Một phần | Chưa đạt | Chưa đạt | Đảm bảo độ tương phản cao, hỗ trợ điều hướng phím Tab |
| **CMP-11** | Tối ưu hóa giao diện di động (Mobile First) | **Touch target 44px** | Tốt | Chật chội | Nhiều chữ | Nút bấm to rõ, dễ bấm trên mọi kích thước smartphone |
| **CMP-12** | ĐIỂM TRUNG BÌNH UX/UI (Thang điểm 10) | **9.12 / 10** | 8.24 / 10 | 6.66 / 10 | 7.32 / 10 | MedSi dẫn đầu về tốc độ, định vị Near-me và chống đặt trùng |

---

## 🔬 2. Đánh Giá Điểm Mạnh & Điểm Yếu Từng Đối Thủ

### 2.1. YouMed (8.24 / 10)
- **Thế mạnh:** Giao diện xanh dương chuẩn y tế, thiết kế thẻ bác sĩ đẹp, quản lý hồ sơ gia đình tốt.
- **Hạn chế:** Phễu 5 bước còn dài; không có khóa giữ slot đếm ngược; chỉ lọc theo quận chứ không có GPS km thực tế.

### 2.2. Medpro (6.66 / 10)
- **Thế mạnh:** Mạng lưới liên kết bệnh viện công tuyến trung ương rất mạnh, có VietQR động.
- **Hạn chế:** Quá nhiều bước (6 bước), giao diện chữ dày đặc, thiếu white-space, dùng Spinner gây ức chế tâm lý.

### 2.3. BookingCare (7.32 / 10)
- **Thế mạnh:** Thông tin chuyên môn bác sĩ rất phong phú, nhiều bài viết tư vấn y khoa hữu ích.
- **Hạn chế:** Không có cổng thanh toán tức thời, hủy lịch phải gọi điện thoại, chưa có QR Check-in tại viện.

---

## 🏆 3. Bốn Trụ Cột Đột Phá Của MedSi
1. **Phễu 3 bước siêu tốc:** Chọn slot ➔ Chọn hồ sơ ➔ Quét mã VietQR hoàn tất.
2. **Định vị GPS Near-me thông minh:** Tính chính xác khoảng cách km theo Haversine mặt cầu, kèm Fallback chọn quận khi bị chặn GPS.
3. **Khóa slot đếm ngược 10:00 phút:** Triệt tiêu hoàn toàn rủi ro đặt trùng giờ.
4. **Tiêu chuẩn trợ năng y tế WCAG 2.1 AA:** Màu sắc có độ tương phản $\ge 4.5:1$, touch target 44px, hỗ trợ điều hướng phím Tab.