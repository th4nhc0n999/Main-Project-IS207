# KHUNG CHƯƠNG 2: THIẾT KẾ KIẾN TRÚC & CƠ CHẾ BẢO MẬT HỆ THỐNG MEDSI

- **Mã việc:** S4-15
- **Người soạn thảo:** Nguyễn Thành Công
- **Trạng thái:** Hoàn thiện khung 11 mục; đã điền chi tiết mục 2.1, 2.2, 2.4 theo phân công Sprint 4.

---

## MỤC LỤC CHƯƠNG 2 (KHUNG 11 MỤC CHUẨN)

1. **2.1. Tổng quan Kiến trúc Hệ thống & Cơ chế Xác thực (Đã điền chi tiết)**
2. **2.2. Mô hình Phân quyền RBAC & Chính sách An toàn Bảo mật (Đã điền chi tiết)**
3. 2.3. Thiết kế Cơ sở Dữ liệu Quan hệ & Ràng buộc Toàn vẹn (An phụ trách)
4. **2.4. Nhật ký Kiểm toán Hệ thống & Quản lý Vòng đời Lịch khám (Đã điền chi tiết)**
5. 2.5. Thiết kế Quản lý Hồ sơ Bệnh nhân & Bằng chứng Đồng thuận Dữ liệu (Hiệu phụ trách)
6. 2.6. Thiết kế Khung giờ Khám & Cơ chế Kiểm soát Đồng thời Concurrency (Hoài Bảo phụ trách)
7. 2.7. Quy trình Đặt lịch Bác sĩ & Duyệt lịch Hẹn (Hoài Bảo phụ trách)
8. 2.8. Quy trình Đặt lịch Bệnh viện & Cấp phát Phiếu khám QR (Tuấn Anh phụ trách)
9. 2.9. Tích hợp Thanh toán Trực tuyến & Chính sách Hoàn tiền Đa tầng (Khôi phụ trách)
10. 2.10. Kiến trúc Giao diện Người dùng & Trải nghiệm Đặt khám Gần tôi (Quốc Huy phụ trách)
11. 2.11. Bảng điều khiển Quản trị & Báo cáo Thống kê Doanh thu (Hoàng Huy phụ trách)

---

## CHI TIẾT CÁC MỤC ĐƯỢC PHÂN CÔNG

### 2.1. TỔNG QUAN KIẾN TRÚC HỆ THỐNG & CƠ CHẾ XÁC THỰC

#### 2.1.1. Kiến trúc phân tầng (Multi-tier Architecture)
Hệ thống MedSi được xây dựng theo mô hình phân tách độc lập giữa Client và Server (Decoupled Client-Server Architecture):
- **Tầng Client (Frontend):** Ứng dụng Single Page Application (SPA) xây dựng trên nền tảng React 18, Vite và Tailwind CSS, giao tiếp với máy chủ thông qua RESTful API chuẩn JSON.
- **Tầng Ứng dụng (Application Server):** Khung dịch vụ Laravel 12 (PHP 8.2+) xử lý toàn bộ logic nghiệp vụ, tính toán biểu phí, kiểm soát chuyển trạng thái, điều phối tác vụ lập lịch (Scheduler) và phân quyền bảo mật.
- **Tầng Cơ sở Dữ liệu (Data Storage):** Hệ quản trị cơ sở dữ liệu MySQL 8.0 (InnoDB Engine) đảm bảo tính toàn vẹn giao dịch (ACID), thực thi các ràng buộc CHECK, khóa ngoại RESTRICT và chỉ mục tối ưu hóa hiệu năng truy vấn.

#### 2.1.2. Cơ chế Xác thực & Quản lý Phiên (Authentication & Token Management)
- Hệ thống áp dụng giao thức xác thực dựa trên mã thông báo (Token-based Authentication) thông qua thư viện Laravel Sanctum.
- Khi người dùng đăng nhập thành công với tài khoản hợp lệ, máy chủ phát hành một Personal Access Token duy nhất đại diện cho phiên làm việc hiện hành. Mã token này được truyền trong HTTP Authorization Header dạng `Bearer <token>` cho mọi yêu cầu tiếp theo.
- **Quy trình thu hồi token (Token Revocation):**
  - Khi người dùng chủ động đăng xuất (`/api/auth/logout`), token phiên hiện tại lập tức bị xóa khỏi bảng `personal_access_tokens`.
  - Khi tài khoản bị kích hoạt cơ chế khóa do nhập sai mật khẩu quá số lần quy định, hệ thống tự động xóa toàn bộ token đang hoạt động của tài khoản đó để ngăn chặn mọi hành vi tiếp tục sử dụng phiên cũ.

#### 2.1.3. Cơ chế Chống tấn công Brute-Force & Khóa Tài khoản Tự động (BR-AUTH-02)
- **Giới hạn tỷ lệ truy cập (Rate Limiting):** Sử dụng `Illuminate\Support\Facades\RateLimiter` để đếm số lần thử đăng nhập thất bại theo địa chỉ email định danh trong khoảng thời gian cửa sổ trượt 60 giây (`config('medsi.login_window_seconds', 60)`).
- **Ngưỡng khóa (Lockout Threshold):** Nếu người dùng nhập sai mật khẩu 5 lần (`config('medsi.login_max_attempts', 5)`), hệ thống ngay lập tức:
  1. Cập nhật trạng thái người dùng sang `locked`.
  2. Gán mốc thời gian hết hạn khóa: `locked_until = now()->addMinutes(15)`.
  3. Xóa sạch mọi token đang hoạt động của tài khoản.
  4. Ghi nhận sự kiện kiểm toán `AU-03`.
- **Thông báo an toàn:** Khi tài khoản đang trong trạng thái bị khóa, máy chủ trả về mã lỗi HTTP 423/403 kèm thông tin số phút khóa còn lại (`remaining_minutes`). Đối với các trường hợp nhập sai thông thường, hệ thống luôn trả về thông điệp trung tính `"Thông tin đăng nhập không chính xác."` nhằm triệt tiêu nguy cơ rò rỉ danh sách tài khoản hợp lệ qua kỹ thuật User Enumeration.
- **Mở khóa tự động (Self-healing Lockout):** Khi người dùng quay lại đăng nhập sau khi thời hạn `locked_until` đã trôi qua, middleware xác thực tự động phát hiện, hoàn nguyên trạng thái tài khoản về `active`, xóa bộ đếm thất bại mà không cần có sự can thiệp thủ công từ quản trị viên.

---

### 2.2. MÔ HÌNH PHÂN QUYỀN RBAC & CHÍNH SÁCH AN TOÀN BẢO MẬT

#### 2.2.1. Ma trận Phân quyền Dựa trên Vai trò (Role-Based Access Control)
Hệ thống thiết lập 4 vai trò có tài khoản lưu trữ trong cơ sở dữ liệu (`role` trong bảng `users`) và 1 tác nhân vãng lai không có tài khoản:
1. **Khách vãng lai (`guest`):** Không có tài khoản trong hệ thống. Chỉ được phép tra cứu danh mục công khai (chuyên khoa, danh sách bệnh viện, bác sĩ, bảng giá dịch vụ) và gửi yêu cầu đăng ký/đăng nhập.
2. **Bệnh nhân (`patient`):** Quản lý hồ sơ cá nhân và hồ sơ người thân (tối đa 10 hồ sơ), quản lý bằng chứng đồng thuận dữ liệu, thực hiện đặt lịch khám mới, xem lịch sử khám và tự hủy lịch khám trước 24 giờ. Tuyệt đối không được xem dữ liệu của bệnh nhân khác.
3. **Bác sĩ (`doctor`):** Phải gắn với một bản ghi duy nhất trong bảng `doctors` thông qua trường `user_id`. Chỉ có quyền xem và duyệt/từ chối lịch khám thuộc ca mình phụ trách, xem hồ sơ của bệnh nhân thuộc lịch mình khám, cập nhật hồ sơ chuyên môn và đánh dấu hoàn thành ca khám (`completed`). Bác sĩ tuyệt đối không được truy cập các chức năng quản trị hệ thống.
4. **Nhân viên cơ sở (`staff`):** Bắt buộc phải gắn với một cơ sở y tế cố định (`hospital_id` không được phép null, được bảo vệ bằng ràng buộc `ck_users_scope`). Nhân viên cơ sở chỉ có quyền tra cứu lịch và thực hiện quét mã QR check-in tiếp nhận bệnh nhân tại đúng cơ sở mình công tác. Nhân viên cơ sở không có quyền hủy lịch hay xem lịch sử viện phí của cơ sở khác.
5. **Quản trị viên (`admin`):** Toàn quyền quản trị danh mục, tài khoản người dùng, xem toàn bộ nhật ký kiểm toán, phê duyệt yêu cầu hoàn tiền, và thực hiện các can thiệp hỗ trợ khẩn cấp (hủy hộ lịch dưới 24 giờ, xác nhận No-Show, ghi nhận check-in/completed thủ công có lý do).

#### 2.2.2. Thiết kế Middleware & Authorization Policies
Hệ thống thực thi an toàn bảo mật ở cấp độ backend thông qua hai lớp phòng thủ:
- **Lớp Middleware:**
  - `EnsureUserRole`: Chặn ngay tại cổng vào HTTP nếu vai trò của token không khớp với các vai trò được cấp phép cho route.
  - `EnsureUserActive`: Kiểm soát trạng thái tài khoản. Chặn tài khoản `pending` (bắt buộc chuyển hướng đến đổi mật khẩu), tài khoản `locked` (báo thời gian chờ), và tài khoản `disabled` (từ chối vĩnh viễn).
  - `EnsureStaffHospitalScope`: Ngăn chặn nhân viên cơ sở không có `hospital_id` hợp lệ thực hiện thao tác.
- **Lớp Domain Policy (`BookingPolicy`):**
  - Kiểm tra quyền sở hữu đối tượng chi tiết: Đảm bảo người dùng chỉ được xem đúng bản ghi mà mình sở hữu (`$booking->user_id === $auth->id` hoặc `$doctor->user_id === $auth->id`).
  - Kiểm tra điều kiện thời gian: Bệnh nhân chỉ được hủy lịch khi thời gian hiện tại cách giờ khám tối thiểu 24 giờ (`$now <= $cutoff`).

#### 2.2.3. Quy trình Đăng nhập Lần đầu của Bác sĩ (BR-AUTH-04)
- Khi quản trị viên tạo tài khoản cho bác sĩ mới, hệ thống khởi tạo tài khoản ở trạng thái `pending`.
- Khi bác sĩ đăng nhập lần đầu tiên với mật khẩu tạm thời do quản trị viên cấp, middleware `EnsureUserActive` sẽ chặn toàn bộ các route nghiệp vụ và chỉ cho phép truy cập duy nhất vào endpoint `/api/auth/first-login-change-password`.
- Sau khi bác sĩ cung cấp mật khẩu mới đạt chuẩn an toàn (tối thiểu 8 ký tự, có xác nhận khớp), hệ thống băm mật khẩu bằng BCRYPT, cập nhật trạng thái người dùng thành `active`, đồng thời ghi nhận sự kiện kiểm toán `AU-05`. Kể từ thời điểm này, bác sĩ mới có đầy đủ quyền hạn truy cập bảng làm việc chuyên môn.

---

### 2.4. NHẬT KÝ KIỂM TOÁN HỆ THỐNG & QUẢN LÝ VÒNG ĐỜI LỊCH KHÁM

#### 2.4.1. Thiết kế Bảng Nhật ký Kiểm toán Bất biến (Immutable Audit Logs)
- Nhật ký kiểm toán được lưu trữ tập trung tại bảng `audit_logs` với 20 nhóm sự kiện nghiệp vụ chuẩn hóa từ `AU-01` đến `AU-20`.
- **Nguyên tắc bất biến (Append-Only):** Bảng `audit_logs` chỉ chấp nhận lệnh `INSERT`. Cấu hình tài khoản cơ sở dữ liệu ứng dụng không được cấp quyền `UPDATE` hay `DELETE` trên bảng này.
- **Cơ chế che giấu dữ liệu nhạy cảm tự động (`AuditLogger::sanitizeData`):** Nhằm tuân thủ quy chuẩn bảo vệ dữ liệu cá nhân y tế, mọi thông tin trước khi ghi vào cột `changes` dạng JSON đều phải đi qua bộ lọc khử nhạy cảm. Toàn bộ các khóa định danh như `password`, `identity_card_number` (CCCD), `qr_token`, `health_insurance_code` (BHYT) đều được thay thế hoàn toàn bằng chuỗi ký tự đại diện `***MASKED***`.

#### 2.4.2. Vòng đời Lịch khám & Máy trạng thái `BookingStateMachine`
Toàn bộ lịch khám trong hệ thống MedSi vận hành theo một cỗ máy trạng thái hữu hạn gồm 9 trạng thái chuẩn:
`pending_payment` -> `pending_approval` -> `confirmed` -> `checked_in` -> `completed`, cùng các trạng thái kết thúc nhánh: `cancelled`, `expired`, `rejected`, `no_show`.
Mọi thay đổi trạng thái bắt buộc phải đi qua lớp dịch vụ duy nhất `BookingStateMachine` và tuân thủ bảng chuyển tiếp T01 đến T16:
- **T01 (Tạo lịch mới):** Đặt lịch hợp lệ, tăng `booked_count` của slot lên 1 dưới khóa dòng `lockForUpdate`. Đặt thời hạn giữ chỗ 15 phút (`hold_expires_at`).
- **T02 / T02H (Thanh toán thành công):** Lịch bác sĩ chuyển sang `pending_approval` và cấp hạn duyệt 30 phút (`approval_expires_at`). Lịch bệnh viện chuyển thẳng sang `confirmed`, tự động phát hành phiếu khám (`tickets`) và cấp số thứ tự duy nhất theo phạm vi (`queue_scope`, `queue_seq`).
- **T05 / T06 (Bác sĩ duyệt / từ chối):** Bác sĩ chấp nhận chuyển thành `confirmed`; bác sĩ từ chối chuyển thành `rejected`, giải phóng 1 chỗ trên slot (`booked_count - 1`), đồng thời hệ thống tự động phát sinh yêu cầu hoàn 100% tiền (cả phí khám và phí tiện ích).
- **T09 (Check-in tiếp nhận):** Nhân viên cơ sở hoặc Admin quét mã QR hợp lệ trong đúng ngày khám, chuyển trạng thái lịch và phiếu sang `checked_in`.
- **T12 (Hoàn thành ca khám):** Bác sĩ hoặc Admin kết thúc ca khám, chuyển trạng thái lịch và phiếu sang `completed`.

#### 2.4.3. Tác vụ Định kỳ Xử lý Hết hạn & Đánh dấu Vắng mặt (Scheduler Engine)
Một Scheduler định kỳ chạy mỗi phút (`medsi:process-expiries`) đảm nhận 3 nhiệm vụ tự động hóa cốt lõi:
1. **Xử lý T03 (Hết hạn giữ chỗ 15 phút):**
   - Quét các lịch có trạng thái `pending_payment` có `hold_expires_at <= now()`.
   - Nếu lịch có giao dịch thanh toán đang ở trạng thái `pending`, hệ thống tự động gia hạn thêm 5 phút chờ (`grace_minutes`).
   - Nếu đã quá thời hạn và không có giao dịch chờ, hệ thống gọi `BookingStateMachine` chuyển lịch sang `expired`, trừ 1 trên `booked_count` của slot (nếu slot đang `full` sẽ tự động mở lại thành `available`), và cập nhật trạng thái payment tương ứng thành `expired`.
2. **Xử lý T07 (Hết hạn duyệt 30 phút):**
   - Quét các lịch bác sĩ có trạng thái `pending_approval` có `approval_expires_at <= now()`.
   - Hệ thống chuyển lịch sang `expired`, trừ 1 trên `booked_count` của slot, đồng thời tự động tạo yêu cầu hoàn tiền 100% (cả phí khám và phí tiện ích) vào bảng `refunds` theo đúng quy định tại dòng 6 của chính sách hoàn tiền PAY_POLICY.
3. **Đánh dấu Đủ điều kiện Vắng mặt (No-Show Eligibility):**
   - Lịch bác sĩ: Đã quá 15 phút kể từ giờ bắt đầu khung giờ khám (`slot.work_date + slot.start_time + 15m`).
   - Lịch bệnh viện: Đã quá 120 phút kể từ giờ kết thúc ca khám (`slot.work_date + slot.end_time + 120m`).
   - Nếu bệnh nhân vẫn chưa thực hiện check-in (phiếu vẫn ở trạng thái `issued`), hệ thống tự động ghi nhận sự kiện `NO_SHOW_ELIGIBLE` vào nhật ký kiểm toán, hỗ trợ quản trị viên dễ dàng lọc danh sách và thực hiện xác nhận No-Show (T11) thủ công một cách chính xác.

