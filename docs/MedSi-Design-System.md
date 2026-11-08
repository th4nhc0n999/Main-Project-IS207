# Hệ thống giao diện MedSi

Dùng tài liệu này khi thêm trang vào ứng dụng React trong thư mục frontend. Danh sách màn hình đang hoạt động nằm trong `src/App.jsx`.

## Bảng màu

| Vai trò | Màu | Cách dùng |
| --- | --- | --- |
| Hành động chính | `#2D5A27` | `--med-sage` hoặc `bg-sage-600`, chữ trắng cho nút đặt lịch, giữ chỗ, thanh toán |
| Hover | `#274D23` | `hover:bg-sage-700` |
| Nhấn phụ | `#E07A5F` | `--med-coral`, đường dưới tab tìm kiếm đang mở |
| Nền trang | `#F9FBF8` | `--med-paper` |
| Bề mặt | `#FFFFFF` | Thẻ kết quả, vùng nhập liệu, bảng, hộp thoại |
| Nền sage nhạt | `#EAF0E5` | `--med-tint`, nút phụ, bước đã hoàn tất |
| Chữ | `#1F2937` | `--med-ink`, tiêu đề và nội dung |
| Chữ phụ | `#526154` | `--med-muted`, nhãn trong bảng tóm tắt |
| Viền | `#D7DFD4` | `--med-line`, đường phân cách 1px |
| Lỗi | `#842E25` trên `#FFF2EE` | Thông báo có nội dung cụ thể, dùng role="alert" |
| Nền đậm | `#193723` | Chân trang, đầu trang quản trị |

Biến CSS và bố cục nghiệp vụ nằm ở `src/clinic.css`. Bảng sắc độ Tailwind nằm ở `tailwind.config.js`; biến cho các primitive Button, Card, Input ở `src/index.css`. Khi đổi màu thương hiệu, cập nhật cả các khai báo tương ứng trong `src/pages/home.css`.

## Kiểu chữ và Quy chuẩn Typography Tiếng Việt (Typography Guidelines)

Hệ thống giao diện MedSi áp dụng bộ font chuẩn hỗ trợ 100% tiếng Việt, tối ưu hiển thị trên mọi hệ điều hành (đặc biệt là Windows):

### 1. Bộ font chuẩn (Font Stack)
- **Primary Fonts:** `Inter` (Google Fonts, weights 300..800) kết hợp `Be Vietnam Pro` (chuyên biệt cho tiếng Việt).
- **CSS Font Family Stack:**
  ```css
  font-family: 'Inter', 'Be Vietnam Pro', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  ```
- **Khai báo Tailwind (`tailwind.config.js`):**
  ```javascript
  fontFamily: {
    sans: ['Inter', 'Be Vietnam Pro', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
  }
  ```
- **Khử răng cưa & hiển thị sắc nét toàn cục (`src/index.css`):**
  ```css
  html, body {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
  }
  ```

### 2. Các quy tắc cấm kỵ (Anti-patterns & Rules to Prevent Regressions)
- ❌ **TUYỆT ĐỐI KHÔNG dùng font Arial riêng lẻ hoặc hardcode `font-family: Arial, sans-serif`**: Arial trên Windows gặp lỗi nghiêm trọng với các dấu tiếng Việt phức tạp (`ạ`, `ấ`, `ộ`, `ệ`, `ặ`), gây nhảy font fallback và lệch chân chữ.
- ❌ **TUYỆT ĐỐI KHÔNG dùng `font-black` (font-weight: 900) trên văn bản tiếng Việt**: Font weights quá lớn kích hoạt thuật toán nét giả (faux bold), làm dấu nặng (dot below) và dấu mũ/móc bị phình to hoặc méo mó. Chỉ sử dụng tối đa `font-bold` (700) hoặc `font-extrabold` (800).
- ❌ **TUYỆT ĐỐI KHÔNG dùng negative letter-spacing quá chặt (`letter-spacing: -0.03em` trở lên)**: Khoảng cách âm làm các dấu tiếng Việt ở các ký tự liền kề đè và va chạm vào nhau. Luôn giữ `letter-spacing: normal` hoặc tối đa `-0.01em`.

### 3. Phân cấp cỡ chữ (Hierarchy)
- Viết nhãn tiếng Việt theo kiểu câu, ưu tiên động từ cụ thể như “Chọn ca khám”, “Đổi ca khám”.
- **Tiêu đề trang nghiệp vụ (H1):** `clamp(28px, 3.2vw, 40px)`, đậm `font-bold` (700), line-height `1.2`.
- **Tiêu đề nhóm/phần (H2):** `20px - 24px`, đậm `font-bold` (700) hoặc `font-semibold` (600).
- **Tiêu đề thẻ/mục nhỏ (H3):** `16px - 18px`, đậm `font-semibold` (600).
- **Văn bản thân / Mô tả:** `14px - 15px`, thường `font-normal` (400), line-height `1.6`.
- **Nhãn trường nhập / Nút:** `13px - 14px`, đậm `font-semibold` (600).
- **Giờ khám & Giá tiền:** Sử dụng font số độ rộng cố định `font-variant-numeric: tabular-nums` kèm `font-bold` để tránh nhảy khung.

Khung chính tối đa 1180px. Khoảng cách giữa hai cột đặt lịch 24px, giữa thẻ 16px. Thẻ nghiệp vụ bo 14px, nền trắng, viền 1px; ô nhập và nút bo 8px, cao tối thiểu 44px. Màn hình tối đa 720px xếp tóm tắt và biểu mẫu thành một cột. Trang chủ dùng các mốc riêng 800px và 590px cho lưới thẻ và ảnh đầu trang.

## Thành phần và màn hình mẫu

| Khi cần | Thành phần hoặc trang tham chiếu | Quy tắc |
| --- | --- | --- |
| Khung trang | `components/layout/PageLayout.jsx`, Navbar, Footer | Đăng ký route bên trong PageLayout để nhận điều hướng theo vai trò và chân trang chung |
| Tìm nơi khám | `HomePage.jsx`, `SearchResultsPage.jsx` | Ba tab Bác sĩ, Bệnh viện, Phòng khám; bộ lọc có nhãn; thẻ chuyên khoa có icon nét mảnh và tên |
| Chọn ca theo bác sĩ | `DoctorDetailPage.jsx` | Nhóm các khung giờ theo ngày; mỗi liên kết mang đúng doctor và slot |
| Chọn ca tại bệnh viện | `HospitalBookingPage.jsx` | Thứ tự cơ sở → chuyên khoa → loại khám → ca; hiển thị lựa chọn hiện tại trong bảng tóm tắt |
| Tiến trình | `components/BookingSteps.jsx` | Truyền current từ 1 đến 3. Bước hiện tại dùng aria-current; bước xong có dấu kiểm |
| Hồ sơ | `BookingConfirmPage.jsx`, `components/ProfileCreator.jsx` | Tách tạo mới với chọn hồ sơ đã có; giữ nhãn, trường bắt buộc và đồng ý dữ liệu |
| Yêu cầu đăng nhập | `components/BookingSignIn.jsx` | Truyền title theo công việc người dùng đang làm; lưu đường dẫn quay lại |
| Thanh toán và hoàn tiền | `PaymentPage.jsx` | Khung tối đa 780px, hiển thị mã lịch, phí, tổng tiền, thời hạn và trạng thái. Theo dõi hoàn tiền dùng trang riêng trong cùng component |
| Lịch và phiếu | `BookingHistoryPage.jsx`, `TicketPage.jsx` | Tab trạng thái dùng cả chữ và màu. Ưu tiên số thứ tự, giờ và QR; ẩn điều hướng và nút tải khi in |
| Tài khoản | `LoginPage.jsx`, `RegisterPage.jsx`, `MyBookingsPage.jsx` | Thẻ biểu mẫu với nhãn rõ ràng, hành động chính màu sage |
| Bác sĩ, tiếp nhận, quản trị | `DoctorAppointments.jsx`, `CheckInPage.jsx`, `pages/Admin/` | Giữ mã lịch, trạng thái và thao tác cùng hàng. Cho phép cuộn bảng ngang trên màn hình hẹp |
| Trang không tồn tại | `NotFoundPage.jsx` | Hai lối ra về trang chủ hoặc tìm bác sĩ |

Các tệp trang nằm trong `frontend/src/pages/`; các thành phần dùng chung nằm trong `frontend/src/components/`. Dùng icon Lucide và ảnh chụp thực tế. Chỉ hiển thị điểm đánh giá khi dữ liệu có điểm.

## Mẫu cho một bước đặt lịch mới

```jsx
<section className="clinic">
  <h1>Chọn hồ sơ người khám</h1>
  <BookingSteps current={2}/>
  <div className="booking-columns">
    <aside className="booking-summary">{summary}</aside>
    <article>{form}</article>
  </div>
</section>
```

Đặt tóm tắt ở cột trái và thao tác ở cột phải. Dùng `label` cho trường nhập, `disabled` khi thiếu lựa chọn bắt buộc và văn bản giải thích khi hết ca. Kiểm tra cả trạng thái tải, lỗi, danh sách rỗng và người dùng chưa đăng nhập. Với phiếu khám, kiểm tra thêm bản in và việc tải PNG.
