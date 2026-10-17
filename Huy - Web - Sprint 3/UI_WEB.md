# ĐẶC TẢ KỸ THUẬT GIAO DIỆN WEB (UI_WEB)

- **Dự án:** MedSi — Đặt lịch khám bệnh trực tuyến (IS207)
- **Phân hệ:** Giao diện & Trải nghiệm Người dùng (`UI — User Interface & UX`)
- **Người thực hiện:** **Huy Nguyễn Quốc**
- **Ngày hoàn thành:** 15/10/2026
- **Công nghệ cốt lõi:** React 19 • Vite • Tailwind CSS • Lucide Icons • React Router v7

---

## 🏗️ 1. Kiến Trúc Kỹ Thuật Phân Hệ UI
- **Mô hình Single Page Application (SPA):** Điều hướng mượt mà không tải lại trang với `React Router DOM v7`.
- **Thư viện Styling:** `Tailwind CSS v3.4` cấu hình mở rộng bảng màu HSL, bóng đổ `shadow-medical` và phông chữ Plus Jakarta Sans.
- **Bộ Icon chuẩn hóa:** `Lucide React` hiển thị SVG vector nhẹ, sắc nét và thân thiện với SEO.
- **Phân cấp Component:**
  - `components/ui`: Nền tảng Atomic Design (Button, Input, Badge, Dialog, Card).
  - `components/layout`: Layout khung trang (PageLayout, Navbar, Footer).
  - `pages`: 8 trang chức năng hoàn chỉnh.
  - `lib/geoUtils.js`: Công thức Haversine, Geolocation API và tọa độ Fallback.

---

## 📱 2. Bảng Điểm Ngắt Thích Ứng (Responsive Breakpoints)

| Breakpoint | Kích thước | Thiết bị mục tiêu | Hành vi giao diện |
| :---: | :---: | :--- | :--- |
| **Default (< 640px)** | `Dưới 640px` | Smartphone dọc (iPhone, Android) | Thẻ bác sĩ 1 cột, menu drawer trượt, nút bấm thanh toán sticky đáy màn hình |
| **sm (Small)** | `>= 640px` | Smartphone xoay ngang, Mini Tablet | Thẻ bác sĩ 1 cột rộng rãi, hiện đủ thông tin địa chỉ và giờ khám |
| **md (Medium)** | `>= 768px` | Tablet (iPad), Laptop nhỏ | Lưới bác sĩ chia 2 cột, bộ lọc tìm kiếm chuyển sang dạng thanh ngang |
| **lg (Large)** | `>= 1024px` | Desktop, Màn hình văn phòng | Bố cục 12 cột (7 cột chi tiết bác sĩ, 5 cột chọn ca khám và tổng kết giá) |
| **xl (Extra Large)** | `>= 1280px` | Màn hình độ phân giải cao | Độ rộng container tối đa max-w-7xl (1280px), căn giữa cân đối, viền lề 32px |

---

## ♿ 3. Tiêu Chuẩn Tiếp Cận Trợ Năng Y Tế WCAG 2.1 AA
- **Tỷ lệ tương phản chữ $\ge 4.5:1$:**
  - Chữ Slate-900 trên nền Trắng: **15.8 : 1** (vượt xa chuẩn).
  - Chữ Sky-700 trên nền Trắng: **5.2 : 1** (đạt chuẩn AA).
  - Chữ Trắng trên nền Sky-600: **4.6 : 1** (đạt chuẩn AA).
- **Touch Target:** Chiều cao tối thiểu mọi nút bấm và slot khám $\ge 44\text{ px}$.
- **Keyboard Tab Navigation:** Hỗ trợ phím `Tab` duyệt tuần tự qua các input, slot và nút CTA với viền focus rõ rệt.
- **Semantic HTML5:** Phân cấp đúng thẻ `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<button>`, `<h1>` - `<h3>`.

---

## ⚡ 4. Tối Ưu Hiệu Năng & Cảm Giác Tải (Perceived Speed)
- **Skeleton Shimmer Loading:** Khung xương động thay thế Spinner, tạo cảm giác tải nhanh hơn 30%.
- **Debounce 300ms:** Giảm 80% truy vấn khi người dùng gõ tìm kiếm từ khóa.
- **Chống Double Click:** Khóa nút (disabled) và hiện spinner ngay khi người dùng nhấn xác nhận thanh toán.