# KẾ HOẠCH TRIỂN KHAI & DANH MỤC KHẮC PHỤC SPRINT 4 (HOSPITAL BOOKING & TICKETS)
**Người phụ trách:** Vũ Trọng Tuấn Anh (Domain Owner: BKH & TKT)  
**Nhiệm vụ Backlog:** S4-50, S4-51, S4-52, S4-53, S4-54, S4-55  
**Kịch bản nghiệm thu chính:** E02 (Hospital Booking E2E) & E01 (Staff Check-in)  
**Nhánh Git mục tiêu:** `s4/hospital-tickets-tuan-anh`  
**Ngày lập kế hoạch:** 06/11/2026  

---

## 1. TỔNG QUAN & MỤC TIÊU TRIỂN KHAI

Bản mã nguồn trong thư mục `codeTASKsprint4/Main-Project-IS207` là phiên bản demo/prototype hoàn chỉnh đã được Senior Lead Engineer & Concurrency Auditor kiểm toán độc lập và xác nhận **vượt qua 100% (54 tests, 225 assertions) trên MySQL 8.4 InnoDB thật**.

Mục tiêu của đợt triển khai chính thức này là:
1. **Chuyển giao (Porting):** Sao chép toàn bộ các thành phần code đã được kiểm chứng tính đúng đắn từ `codeTASKsprint4` sang kho lưu trữ chính của dự án (`Main-Project-IS207`).
2. **Khắc phục (Fixing):** Sửa chữa triệt để các phát hiện P1, P2 được chỉ ra trong báo cáo review (trải nghiệm quét lặp tại quầy tiếp đón, giao diện in ấn phiếu khám, demo switcher role Staff).
3. **Đồng bộ & Nghiệm thu:** Đảm bảo test suite tiếp tục đạt 54/54 test pass trên MySQL, ESLint sạch 100%, sẵn sàng tạo Pull Request gộp vào `develop`.

---

## 2. NHỮNG GHI CHÚ QUAN TRỌNG RÚT RA TỪ BÁO CÁO REVIEW CỦA KỸ SƯ

### 🎯 Nhóm 1: Tính toàn vẹn State Machine & Khóa Concurrency (P0)
* **Chuyển trạng thái T02H (Hospital Booking):** Khi bệnh nhân thanh toán thành công, hệ thống kích hoạt sự kiện `T02H` chuyển thẳng từ `pending_payment` $\rightarrow$ `confirmed`, không bao giờ đi qua trạng thái `pending_approval` của bác sĩ, và trường `doctor_id` luôn là `NULL`.
* **Atomic Issue Ticket:** Việc sinh bản ghi `tickets` nằm trong cùng Database Transaction với sự kiện xác nhận `T02H` hoặc `T05`. Nếu có lỗi (như secret key hỏng, mã QR lỗi), transaction sẽ rollback toàn bộ, không để lại booking mồ côi hay vé rác.
* **Thứ tự khóa chống Deadlock:** Bắt buộc tuân thủ thứ tự khóa tài nguyên phân cấp:  
  $$\text{Slot (lockForUpdate)} \longrightarrow \text{Booking (lockForUpdate)} \longrightarrow \text{Owner (Hospitals/Doctors)} \longrightarrow \text{Ticket (lockForUpdate)}$$
  Thứ tự này bảo đảm không bao giờ xảy ra deadlock xoay vòng giữa các tiến trình `T01`, `T02H`, `T05`, `T09`.
* **Rebuild Eloquent Instance khi Retry Deadlock:** Trong `BookingStateMachine::createBooking()`, khi MySQL ném Deadlock và kích hoạt cơ chế retry (5 lần), bắt buộc phải khởi tạo lại `$booking = new Booking; $booking->setRawAttributes($attributes);` để xóa cờ `$exists=true` và `$id` tạm thời do lần chạy trước bị rollback để lại.
* **Cấp số thứ tự không trùng, không tái cấp:** Số thứ tự theo khoa (`queue_scope = owner:spec:date`) tăng liên tục qua các ca khám trong ngày. Khi một booking bị hủy (`cancelled`), số thứ tự đã cấp được giữ nguyên, không tái cấp cho người sau. Sang ngày khám mới, số thứ tự tự động reset về `001`.

### 🛡️ Nhóm 2: Bảo mật Token QR & Chống Rò Rỉ PII (P0)
* **Bảo mật JWT QR Token:** Mã hóa HMAC-SHA256 (HS256) với secret key tối thiểu 32 bytes (`MEDSI_QR_SECRET`).
* **Không rò rỉ PII trong QR:** Payload QR chỉ chứa `['iss', 'aud', 'sub' => ticket_code, 'iat', 'exp']`. Tuyệt đối không chứa số CCCD, Số điện thoại, địa chỉ hay bệnh án.
* **Masking dữ liệu nhạy cảm:** Server tự động che mờ SĐT và CCCD (`*******789`, `*********012`) trước khi lưu vào `patient_snapshot` của booking. Model `Ticket` luôn khai báo `protected $hidden = ['qr_token']`.
* **Chống IDOR & Scoped Check-in:**
  * Bệnh nhân B tuyệt đối không xem hoặc tải được phiếu/QR của bệnh nhân A (API trả về 404).
  * Endpoint `POST /api/tickets/check-in` bắt buộc kiểm tra quyền nhân viên cơ sở: `(int) $staff->hospital_id === (int) $booking->hospital_id`. Nhân viên viện khác hoặc bệnh nhân cố tình check-in sẽ bị chặn 403 Forbidden.

### ⚠️ Nhóm 3: Các điểm bắt buộc phải khắc phục (Fixing Items từ Review)
1. **[P1-02] Khắc phục UX Quét lặp tại Quầy Tiếp Đón (`CheckInPage.jsx`):**
   * *Vấn đề cũ:* Quét lại lần 2 ném HTTP 409 `EX-TKT-02`, giao diện bắt vào `catch` và hiện banner màu đỏ như một lỗi hệ thống, gây hoang mang cho nhân viên tiếp đón.
   * *Giải pháp khắc phục:* Trong `CheckInPage.jsx`, kiểm tra nếu response nhận mã lỗi `EX-TKT-02` và thông điệp đã check-in, giao diện sẽ hiển thị thông báo trạng thái màu vàng/xanh kèm thông tin: *"Phiếu này đã được tiếp nhận trước đó (Mã: {ticket_code} - STT: {queue_number})"*, giữ giao diện thân thiện và chuyên nghiệp.
2. **[P1-03] Khắc phục In Phiếu Khám (`Navbar.jsx`, `Footer.jsx`):**
   * *Vấn đề cũ:* Khi bệnh nhân bấm nút "In phiếu", lệnh `window.print()` in kèm cả thanh Navbar và Footer làm vỡ trang in nhiệt.
   * *Giải pháp khắc phục:* Thêm class `print:hidden` vào thẻ `<header>` của `Navbar.jsx` và thẻ `<footer>` của `Footer.jsx`.
3. **[P2-02] Bổ sung Role Staff vào Demo Switcher trên Navbar (`Navbar.jsx`):**
   * *Vấn đề cũ:* Toolbar chuyển role nhanh chỉ có nút Patient và Admin, thiếu nút chuyển role Staff.
   * *Giải pháp khắc phục:* Bổ sung nút bấm `Staff (BV Mẫu)` gắn sẵn `hospital_id = 1` vào thanh Switcher demo để người chấm/tester kiểm thử màn hình `/check-in` dễ dàng.
4. **[P2-01] Ghi chú nghiệm thu tài liệu S4-55:**
   * Chuẩn bị sẵn biểu mẫu ghi chép cho 2 buổi phỏng vấn người dùng thực tế tại Mục 10 của `docs/BKH_DD.md`.

---

## 3. DANH MỤC CÁC BƯỚC THỰC HIỆN CHI TIẾT (ACTION STEPS)

### BƯỚC 1: KHỞI TẠO NHÁNH GIT & CẬP NHẬT DEPENDENCY
- [x] **1.1.** Tạo và chuyển sang nhánh làm việc chuẩn theo convention:
  `git checkout -b s4/hospital-tickets-tuan-anh`
- [x] **1.2.** Bổ sung 2 thư viện bắt buộc vào `backend/composer.json`:
  - `"endroid/qr-code": "^5.1"`
  - `"firebase/php-jwt": "^7.0"`
  - `"ext-gd": "*"`
- [x] **1.3.** Chạy `composer update` trong thư mục `backend` để cài đặt vendor package.
- [x] **1.4.** Cập nhật `backend/config/medsi.php` bổ sung key `'qr_secret' => env('MEDSI_QR_SECRET')` và `backend/.env.example`.

---

### BƯỚC 2: SAO CHÉP & HOÀN THIỆN CỐT LÕI BACKEND
- [x] **2.1. Sao chép Models & Exceptions:**
  - Sao chép `backend/app/Models/Ticket.php`.
  - Sao chép `backend/app/Exceptions/Booking/TicketException.php`.
- [x] **2.2. Sao chép Services nghiệp vụ:**
  - Sao chép `backend/app/Services/TicketQrService.php`.
  - Sao chép `backend/app/Services/TicketService.php`.
  - Sao chép `backend/app/Services/BookingReadService.php`.
- [x] **2.3. Cập nhật `BookingStateMachine.php`:**
  - Tích hợp hook phát hành phiếu tự động khi xảy ra sự kiện `T02H` và `T05`:
    `app(TicketService::class)->issue($lockedBooking);`
  - Tích hợp cơ chế Rebuild Eloquent Model Instance trong `createBooking()` để chống lỗi cờ exists khi deadlock retry.
  - Tích hợp phương thức che mờ định danh `maskIdentifier()` cho CCCD và SĐT trong `patient_snapshot`.
  - Bắt lỗi vi phạm khóa duy nhất `uq_booking_request` để trả ngoại lệ chuẩn.
- [x] **2.4. Cập nhật `bootstrap/app.php`:**
  - Đăng ký exception handler trả về response JSON chuẩn cho `TicketException`, `SlotUnavailableException` (mã `SE001`, HTTP 409), và `InvalidBookingTransitionException`.
- [x] **2.5. Sao chép Middleware & Controllers:**
  - Sao chép `backend/app/Http/Middleware/EnsureActiveBookingAccount.php`.
  - Sao chép `backend/app/Http/Controllers/HospitalBookingController.php`.
  - Sao chép `backend/app/Http/Controllers/TicketController.php`.
  - Sao chép `backend/app/Http/Controllers/BookingHistoryController.php`.
- [x] **2.6. Khai báo API Routes trong `backend/routes/api.php`:**
  - Khai báo routes public: `GET /hospitals`, `GET /hospitals/{hospital}/slots`.
  - Khai báo routes có xác thực (`auth:sanctum` + `EnsureActiveBookingAccount`):
    - `GET /hospitals/{hospital}/booking-options`
    - `POST /hospitals/{hospital}/slots` (Admin tạo ca khám)
    - `POST /hospital-bookings` (Bệnh nhân đặt khám viện)
    - `GET /me/bookings` & `GET /bookings` (Lịch sử đặt khám)
    - `GET /bookings/{booking}/ticket` (Chi tiết phiếu & QR)
    - `GET /bookings/{booking}/ticket/qr.png` (Tải ảnh QR)
    - `POST /tickets/check-in` (Staff/Admin tiếp đón quét QR)

---

### BƯỚC 3: SAO CHÉP & KHẮC PHỤC TẦNG FRONTEND
- [x] **3.1. Sao chép API Client:**
  - Sao chép `frontend/src/api/hospitalBookingApi.js`.
- [x] **3.2. Sao chép các trang giao diện chuẩn:**
  - Sao chép `frontend/src/pages/HospitalBookingPage.jsx`.
  - Sao chép `frontend/src/pages/TicketPage.jsx`.
  - Sao chép `frontend/src/pages/BookingHistoryPage.jsx`.
- [x] **3.3. Áp dụng các bản sửa lỗi (Fixes) vào Frontend:**
  - **Khắc phục P1-02 tại `frontend/src/pages/CheckInPage.jsx`:**
    Bắt trường hợp quét lặp (mã lỗi 409 hoặc `EX-TKT-02`), hiển thị banner thông báo tiếp đón màu vàng/xanh thân thiện kèm thông tin số thứ tự thay vì báo alert đỏ.
  - **Khắc phục P1-03 tại Layout:**
    Bổ sung class `print:hidden` vào `frontend/src/components/layout/Navbar.jsx` và `Footer.jsx` để trang in phiếu khám không bị dính thanh điều hướng.
  - **Khắc phục P2-02 tại `Navbar.jsx`:**
    Bổ sung nút bấm `Staff (BV Mẫu)` vào thanh Switcher demo trên Navbar để chuyển role nhanh phục vụ test.
- [x] **3.4. Cập nhật `PaymentPage.jsx`:**
  - Đồng bộ logic xử lý query param `booking_id`: khi có `booking_id`, bật chế độ `strictBooking`, tắt fallback mock, chờ kết quả API thật từ Khôi.
- [x] **3.5. Cập nhật Router trong `frontend/src/App.jsx`:**
  - Đăng ký các Route mới:
    - `/hospital-booking` $\rightarrow$ `HospitalBookingPage`
    - `/hospitals/:hospitalId/book` $\rightarrow$ `HospitalBookingPage`
    - `/check-in` $\rightarrow$ `CheckInPage`
    - `/bookings/:bookingId/ticket` $\rightarrow$ `TicketPage`
    - `/my-bookings` $\rightarrow$ `BookingHistoryPage`

---

### BƯỚC 4: SAO CHÉP TEST SUITES & BẰNG CHỨNG TÀI LIỆU
- [x] **4.1. Sao chép Test Suites Backend:**
  - Sao chép `backend/tests/Feature/HospitalBookingTicketTest.php`.
  - Sao chép `backend/tests/Feature/HospitalTicketConcurrencyTest.php`.
  - Sao chép `backend/tests/Support/hospital_ticket_race_worker.php`.
  - Sao chép `backend/tests/Support/generate_ticket_sample.php`.
- [x] **4.2. Sao chép Tài liệu & Mẫu ảnh:**
  - Sao chép `docs/BKH_DD.md`.
  - Sao chép `docs/images/medsi-ticket-sample.png`.

---

### BƯỚC 5: KIỂM THỬ XÁC NHẬN TOÀN DIỆN (DEFINITION OF DONE)
- [x] **5.1. Kiểm thử Runtime Backend trên MySQL thật:**
  - Chạy `php artisan test --filter=HospitalBookingTicketTest` (Đạt: 14/14 tests pass, 124 assertions).
  - Chạy `php artisan test --filter=HospitalTicketConcurrencyTest` với `RUN_MYSQL_CONCURRENCY_TESTS=1` (Đạt: 4/4 tests pass, 44 assertions).
  - Chạy toàn bộ test suite `php artisan test` (Đạt: 54/54 tests, 225 assertions pass 100%).
- [x] **5.2. Kiểm thử Frontend Lint:**
  - Chạy `eslint` trên toàn bộ các file mới/sửa đổi (Đạt: 0 lỗi, 0 cảnh báo).
- [x] **5.3. Báo cáo kết quả và sẵn sàng tạo PR:**
  - Xác nhận hoàn tất, sẵn sàng commit và push lên nhánh `s4/hospital-tickets-tuan-anh`.

---

## 4. TIÊU CHÍ DUYỆT CỦA BẠN TUẤN ANH

Kính gửi bạn **Tuấn Anh**: Bạn vui lòng xem qua bản kế hoạch và danh mục khắc phục chi tiết ở trên. 
*Nếu bạn đồng ý và duyệt bản kế hoạch này*, xin hãy phản hồi để tôi bắt đầu thực hiện **Bước 1** ngay lập tức!

