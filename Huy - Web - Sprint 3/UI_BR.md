# QUY TẮC NGHIỆP VỤ GIAO DIỆN & TRẢI NGHIỆM NGƯỜI DÙNG (UI_BR)

- **Dự án:** MedSi — Đặt lịch khám bệnh trực tuyến (IS207)
- **Phân hệ:** Giao diện & Trải nghiệm Người dùng (`UI — User Interface & UX`)
- **Người thực hiện:** **Huy Nguyễn Quốc**
- **Ngày hoàn thành:** 15/10/2026
- **Quy chuẩn:** Chuẩn A6 • Đồng bộ bảng tính `UI_DS_UI_BR_UI_CMP_UI_OQ.xlsx` (Tab `UI_BR`)

---

## 📑 1. Bảng Tổng Hợp 25 Quy Tắc Nghiệp Vụ Giao Diện (Master Register)

| Mã ID | Miền | Nội dung Quy tắc nghiệp vụ (Rule Description) | Lý do hoặc Căn cứ | Ngoại lệ | Ưu tiên | UC liên quan | Bản vẽ đối chiếu |
| :---: | :---: | :--- | :--- | :---: | :---: | :---: | :---: |
| **BR-UI-01** | UI | 3 trạng thái hiển thị Slot khám: Khả dụng (Xanh lá), Đang chọn (Xanh dương), Đã đầy (Xám gạch ngang) | Tránh nhầm lẫn thị giác cho bệnh nhân khi chọn ca khám | Không | `High` | `UC-UI-02` | `UI_WF_03` |
| **BR-UI-02** | UI | Khóa các slot thuộc khung giờ đã qua trong ngày hôm nay | Ngăn chặn người dùng đặt các ca khám trong quá khứ | Không | `High` | `UC-UI-02` | `UI_WF_03` |
| **BR-UI-03** | UI | Bắt buộc chọn 1 hồ sơ người bệnh trước khi bấm 'Tiến hành đặt khám' | Xác định rõ danh tính bệnh nhân khám thực tế | Không | `High` | `UC-UI-04` | `UI_WF_04` |
| **BR-UI-04** | UI | Đồng hồ đếm ngược giữ slot 10:00 phút hiển thị liên tục trên màn hình thanh toán | Đồng bộ thời hạn khóa slot tạm thời với Backend (BKD_BR) | Không | `High` | `UC-UI-05` | `UI_WF_05` |
| **BR-UI-05** | UI | Đồng hồ < 3 phút chuyển sang màu cam, < 1 phút nhấp nháy đỏ | Cảnh báo khẩn cấp bệnh nhân sắp mất vị trí giữ chỗ | Không | `Medium` | `UC-UI-05` | `UI_WF_05` |
| **BR-UI-06** | UI | Hết hạn 10:00: Làm mờ mã VietQR và bật Modal 'Hết hạn giữ chỗ' | Ngăn người dùng quét mã khi slot đã bị hủy trên server | Không | `High` | `UC-UI-05` | `UI_WF_05` |
| **BR-UI-07** | UI | Chỉ cho phép bệnh nhân tự hủy lịch hẹn trước giờ khám tối thiểu 2 tiếng | Để cơ sở y tế kịp điều phối chỗ trống cho bệnh nhân khác | Dưới 2 tiếng phải gọi hotline | `High` | `UC-UI-06` | `UI_WF_06` |
| **BR-UI-08** | UI | Khi bấm 'Bác sĩ gần tôi', gọi Geolocation API xin quyền vị trí | Lấy tọa độ GPS thiết bị phục vụ tính khoảng cách | Không | `High` | `UC-UI-01` | `ACT-UI-01` |
| **BR-UI-09** | UI | Nếu từ chối quyền GPS: Hiện Modal hướng dẫn và mở Dropdown chọn Quận/Huyện | Cơ chế Fallback UX (EX-UI-01) không làm treo luồng tìm kiếm | Không | `High` | `UC-UI-01` | `ACT-UI-01` |
| **BR-UI-10** | UI | Hiển thị khoảng cách theo km làm tròn 1 chữ số thập phân (VD: '1.4 km') | Trực quan hóa cự ly chính xác theo công thức Haversine mặt cầu | Không | `Medium` | `UC-UI-01` | `ACT-UI-01` |
| **BR-UI-11** | UI | Áp dụng Debounce 300ms cho ô tìm kiếm bác sĩ theo từ khóa | Giảm tải 80% request gửi lên server khi người dùng gõ phím | Không | `Medium` | `UC-UI-01` | `UI_WF_02` |
| **BR-UI-12** | UI | Hiệu ứng Skeleton Shimmer thay thế Spinner khi tải danh sách bác sĩ/slot | Tối ưu hóa cảm giác chờ đợi (Perceived loading speed) | Không | `Medium` | `UC-UI-01` | `UI_WF_02` |
| **BR-UI-13** | UI | Mã VietQR động tự động kèm mã booking và số tiền chính xác | Bệnh nhân không cần nhập số tiền và nội dung thủ công | Không | `High` | `UC-UI-05` | `UI_WF_05` |
| **BR-UI-14** | UI | Toast thông báo tự động ẩn sau 4 giây kèm nút x đóng nhanh | Tránh che khuất nội dung quan trọng trên màn hình di động | Không | `Low` | `UC-UI-03` | `UI_WF_03` |
| **BR-UI-15** | UI | Form thêm hồ sơ người bệnh bắt buộc: Họ tên, Ngày sinh, Giới tính, SĐT | Thu thập dữ liệu tối thiểu phục vụ hồ sơ tiếp nhận tại viện | Không | `High` | `UC-UI-03` | `UI_WF_04` |
| **BR-UI-16** | UI | Validation inline xuất hiện ngay khi người dùng rời chuột khỏi ô nhập (onBlur) | Thông báo lỗi sớm, giảm ma sát submit form | Không | `Medium` | `UC-UI-04` | `UI_WF_04` |
| **BR-UI-17** | UI | Nút hành động chính (Submit / Đặt khám) tự động Disable và hiện Loading khi xử lý | Chống hiện tượng double click gửi 2 đơn đặt trùng nhau | Không | `High` | `UC-UI-04` | `UI_WF_04` |
| **BR-UI-18** | UI | Trang My Bookings phân tách 3 tab: Sắp khám, Đã khám, Đã hủy | Giúp bệnh nhân dễ dàng phân loại và tra cứu lịch sử khám | Không | `Medium` | `UC-UI-06` | `UI_WF_06` |
| **BR-UI-19** | UI | Phiếu khám thành công luôn hiển thị mã QR Check-in và hướng dẫn đến viện | Chuẩn bị sẵn sàng cho bước tiếp đón quét mã tại phòng khám | Không | `High` | `UC-UI-05` | `UI_WF_05` |
| **BR-UI-20** | UI | Mọi trường hợp lỗi mạng / 500 đều hiển thị Empty State kèm nút 'Thử lại' | Ngăn ngừa màn hình trắng (Blank screen) gây hoang mang cho bệnh nhân | Không | `High` | `Toàn hệ thống` | `UI_WF_01` |
| **BR-UI-21** | UI | Độ tương phản màu văn bản và nền phải đạt tối thiểu 4.5:1 | Tuân thủ nghiêm ngặt tiêu chuẩn tiếp cận y tế WCAG 2.1 AA | Không | `Medium` | `Toàn hệ thống` | `UI_DS` |
| **BR-UI-22** | UI | Hỗ trợ phím Tab di chuyển tuần tự qua các ô nhập và nút chọn slot | Đảm bảo khả năng tiếp cận bằng bàn phím cho người khiếm khuyết | Không | `Medium` | `Toàn hệ thống` | `UI_DS` |
| **BR-UI-23** | UI | Bộ lọc bán kính Near-me gồm 4 mức: 2km, 5km, 10km, 20km (mặc định 5km) | Phù hợp với cự ly di chuyển đô thị bằng xe máy | Không | `Medium` | `UC-UI-01` | `ACT-UI-01` |
| **BR-UI-24** | UI | Khi chuyển sang tuần khác, tự động chọn ngày đầu tiên có slot trống | Giảm thiểu số lần click tìm kiếm ngày khám của bệnh nhân | Không | `Low` | `UC-UI-02` | `UI_WF_03` |
| **BR-UI-25** | UI | Xác nhận hủy lịch yêu cầu bệnh nhân chọn 1 lý do hủy từ dropdown | Thu thập dữ liệu phản hồi phục vụ cải tiến dịch vụ y tế | Không | `Medium` | `UC-UI-06` | `UI_WF_06` |

---

## 🔬 2. Đặc Tả Chi Tiết 5 Nhóm Quy Tắc Nghiệp Vụ

### 2.1. Nhóm 1: Quản lý Khung giờ, Khóa Slot & Giữ chỗ 10:00 Phút (`BR-UI-01` ➔ `BR-UI-07`, `BR-UI-13`)
- **BR-UI-01 (3 Trạng thái Slot):**
  - `Khả dụng (Available)`: Nền trắng viền Slate-200, hover xanh sky-50, chữ Slate-900. Bấm được ngay.
  - `Đang chọn (Selected)`: Nền Sky-600, chữ trắng, viền Sky-600 bóng đổ xanh.
  - `Đã đầy (Full)`: Nền Slate-100, chữ Slate-400 gạch ngang, cursor-not-allowed, vô hiệu hóa click.
- **BR-UI-02 (Khóa slot quá khứ):** Trong ngày hiện tại, các khung giờ đã trôi qua sẽ tự động chuyển trạng thái Disabled và gán nhãn 'Đã qua giờ'.
- **BR-UI-03 (Bắt buộc hồ sơ bệnh nhân):** Bệnh nhân bắt buộc phải chọn 1 người khám trong danh sách hồ sơ (Bản thân, Con cái, Bố mẹ) trước khi nhấn 'Tiến hành đặt khám'.
- **BR-UI-04 (Đồng hồ đếm ngược 10:00 phút):** Hiển thị dạng Badge nổi bật ở màn hình thanh toán, cập nhật từng giây.
- **BR-UI-05 (Cảnh báo đếm ngược theo ngưỡng):**
  - Thời gian > 3:00 phút: Badge màu Xanh Dương / Trung tính.
  - Thời gian < 3:00 phút: Chuyển sang màu Cam Cảnh Báo (`#F59E0B`).
  - Thời gian < 1:00 phút: Chuyển sang màu Đỏ Nhấp Nháy (`#EF4444 animate-pulse`).
- **BR-UI-06 (Xử lý hết hạn giữ chỗ):** Khi đồng hồ chạm 00:00, mã VietQR bị mờ đục 80% (`opacity-20 pointer-events-none`) và bật Modal thông báo hết hạn kèm nút 'Chọn lại khung giờ'.
- **BR-UI-07 (Quy định tự hủy lịch hẹn):** Cho phép bệnh nhân tự hủy trước giờ khám tối thiểu 2 tiếng. Dưới 2 tiếng, nút hủy bị ẩn và hiển thị hotline phòng khám.
- **BR-UI-13 (VietQR động tích hợp):** Mã QR nhúng sẵn số tài khoản, số tiền và mã booking `MEDSI-xxxxx`, triệt tiêu sai sót nhập tay.

### 2.2. Nhóm 2: Định Vị Toạ Độ GPS, Bán Kính & Fallback Near-Me (`BR-UI-08` ➔ `BR-UI-10`, `BR-UI-23`)
- **BR-UI-08 (Kích hoạt Geolocation):** Gọi `navigator.geolocation.getCurrentPosition()` khi bấm 'Bác sĩ gần tôi' hoặc mở URL `?near=true`.
- **BR-UI-09 (Fallback EX-UI-01 khi từ chối quyền):** Khi quyền bị từ chối hoặc lỗi timeout, hiển thị Modal cho phép chọn 1 trong 11 Quận/Huyện trọng điểm làm mốc toạ độ trung tâm.
- **BR-UI-10 (Công thức Haversine mặt cầu):**
  $$\text{Khoảng cách } d = 2R \cdot \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta\phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta\lambda}{2}\right)}\right)$$
  - Bán kính Trái Đất $R = 6371\text{ km}$.
  - Làm tròn 1 chữ số thập phân (`1.4 km`), cự ly < 100m hiển thị `< 100 m`.
- **BR-UI-23 (4 mốc bán kính tìm kiếm):** `< 2 km` (rất gần), `< 5 km` (mặc định nội thành), `< 10 km`, `< 20 km`.

### 2.3. Nhóm 3: Tối Ưu Hóa Tương Tác & Hiệu Năng Phản Hồi (`BR-UI-11` ➔ `BR-UI-14`)
- **BR-UI-11 (Debounce tìm kiếm 300ms):** Trì hoãn 300ms sau lần gõ phím cuối cùng mới kích hoạt hàm lọc, giảm 80% chi phí tính toán và gọi API.
- **BR-UI-12 (Skeleton Shimmer):** Dùng hiệu ứng khung xương xám chuyển động ánh sáng thay thế vòng quay Spinner để tạo cảm giác phản hồi nhanh hơn.
- **BR-UI-14 (Toast thông báo tự ẩn 4s):** Tự đóng sau 4000ms và có nút x để người dùng tắt ngay lập tức.

### 2.4. Nhóm 4: Xác Thực Biểu Mẫu & Chống Double-Click (`BR-UI-15` ➔ `BR-UI-17`, `BR-UI-25`)
- **BR-UI-15 (Trường bắt buộc hồ sơ):** Kiểm tra Họ tên, Ngày sinh, Giới tính, Số điện thoại (10 chữ số).
- **BR-UI-16 (Validation inline onBlur):** Hiển thị lỗi viền đỏ và text cảnh báo ngay khi người dùng rời khỏi ô nhập liệu.
- **BR-UI-17 (Chống Double Click):** Nút gửi đơn tự động chuyển `disabled = true` và xoay icon Loading khi đang thực thi.
- **BR-UI-25 (Khảo sát lý do hủy lịch):** Bắt buộc chọn 1 lý do từ danh sách khi bấm hủy hẹn.

### 2.5. Nhóm 5: Quản Lý Lịch Hẹn, Tiếp Cận WCAG 2.1 AA & Khôi Phục Lỗi (`BR-UI-18` ➔ `BR-UI-22`, `BR-UI-24`)
- **BR-UI-18 (3 Tab lịch hẹn):** Sắp khám (xanh dương), Đã khám (xanh lá), Đã hủy (xám).
- **BR-UI-19 (Mã QR Check-in):** Phiếu xác nhận in mã QR Check-in tiếp đón tại viện.
- **BR-UI-20 (Empty State kèm nút Thử lại):** Báo lỗi thân thiện kèm nút retry khi mất mạng.
- **BR-UI-21 (Độ tương phản WCAG 2.1 AA):** Mọi cặp màu chữ và nền đều có tỷ lệ tương phản $\ge 4.5:1$.
- **BR-UI-22 (Điều hướng phím Tab):** Tuần tự focus qua các thành phần tương tác bằng bàn phím.
- **BR-UI-24 (Tự động nhảy ngày có slot):** Khi chuyển tuần, tự động gán ngày đầu tiên có slot trống.

---

## 🔗 3. Ma Trận Đối Chiếu Truy Vết Nghiệp Vụ (Traceability Matrix)

| Nhóm quy tắc | Các mã BR-UI | Use Case liên quan | Màn hình Wireframe | Quy chuẩn kỹ thuật áp dụng |
| :--- | :--- | :--- | :--- | :--- |
| **Khung giờ & Khóa slot 10p** | `BR-UI-01` ➔ `07`, `13` | `UC-UI-02`, `UC-UI-04`, `UC-UI-05` | [UI_WF_03](UI_WF/UI_WF_03.png), [UI_WF_04](UI_WF/UI_WF_04.png), [UI_WF_05](UI_WF/UI_WF_05.png) | Redis lock sync, Countdown timer, VietQR generator |
| **Định vị GPS & Near-me** | `BR-UI-08` ➔ `10`, `23` | `UC-UI-01` | [UI_WF_02](UI_WF/UI_WF_02.png), [ACT-UI-01](UI_ACT/ACT-UI-01.png) | W3C Geolocation API, Haversine Spherical R=6371km |
| **Tương tác & Hiệu năng** | `BR-UI-11` ➔ `14` | `UC-UI-01`, `UC-UI-03` | [UI_WF_02](UI_WF/UI_WF_02.png), [UI_WF_03](UI_WF/UI_WF_03.png) | Debounce 300ms, Skeleton Shimmer, Toast auto-dismiss |
| **Xác thực Form & Chống trùng** | `BR-UI-15` ➔ `17`, `25` | `UC-UI-03`, `UC-UI-04`, `UC-UI-06` | [UI_WF_04](UI_WF/UI_WF_04.png), [UI_WF_06](UI_WF/UI_WF_06.png) | onBlur inline validation, Disabled loading button |
| **Quản lý lịch & WCAG 2.1 AA** | `BR-UI-18` ➔ `22`, `24` | `UC-UI-06`, Toàn hệ thống | [UI_WF_01](UI_WF/UI_WF_01.png), [UI_WF_06](UI_WF/UI_WF_06.png), [UI_DS](UI_DS.md) | 3-tab layout, QR check-in, Contrast ratio >= 4.5:1, Keyboard tab order |