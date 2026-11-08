# MedSi Design System & Typography Guidelines

Tài liệu quy chuẩn thiết kế, bảng màu, nhận diện thương hiệu và hệ thống font chữ chính thức của nền tảng MedSi.

---

## 1. Hệ Thống Font Chữ (Typography Guidelines)

Để đảm bảo hiển thị sắc nét 100% tiếng Việt trên mọi hệ điều hành (đặc biệt tránh lỗi bể dấu, vỡ chân chữ, nhảy font trên Windows):

### 1.1. Bộ Font Chuẩn (Standard Font Stack)
- **Primary Fonts:** **Inter** (Google Fonts, weights 300..800) kết hợp **Be Vietnam Pro** (chuyên biệt cho tiếng Việt).
- **CSS Font Family Stack:**
  ```css
  font-family: 'Inter', 'Be Vietnam Pro', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  ```
- **Tailwind Config (`tailwind.config.js`):**
  ```javascript
  fontFamily: {
    sans: [
      'Inter',
      'Be Vietnam Pro',
      'system-ui',
      '-apple-system',
      'BlinkMacSystemFont',
      'Segoe UI',
      'Roboto',
      'Helvetica',
      'Arial',
      'sans-serif',
    ],
  }
  ```
- **Khử răng cưa & tối ưu hiển thị chữ toàn cục (`src/index.css`):**
  ```css
  html, body {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
  }
  ```

### 1.2. Các Quy Tắc Cấm Kỵ (Strict Anti-patterns)
- ❌ **TUYỆT ĐỐI KHÔNG dùng font Arial độc lập hoặc gán cứng `font-family: Arial`:** Arial trên Windows hiển thị lỗi lệch vị trí dấu tiếng Việt phức tạp (`ạ`, `ấ`, `ệ`, `ộ`, `ặ`).
- ❌ **TUYỆT ĐỐI KHÔNG dùng `font-black` (font-weight: 900) trên tiêu đề tiếng Việt:** Gây hiệu ứng "faux bold" (nét giả) làm biến dạng dấu nặng và dấu mũ. Luôn dùng tối đa `font-bold` (700) hoặc `font-extrabold` (800).
- ❌ **TUYỆT ĐỐI KHÔNG dùng negative letter-spacing quá chặt (`letter-spacing: -0.03em` trở lên):** Làm các ký tự và dấu tiếng Việt bị dính hoặc đè lên nhau. Luôn để `letter-spacing: normal` hoặc tối đa `-0.01em`.

### 1.3. Phân Cấp Kích Thước (Type Hierarchy)
- **Tiêu đề trang lớn (H1):** `clamp(28px, 3.2vw, 42px)`, `font-bold` (700), line-height `1.2`.
- **Tiêu đề nhóm/phần (H2):** `20px - 24px`, `font-bold` (700) hoặc `font-semibold` (600).
- **Tiêu đề thẻ (H3):** `16px - 18px`, `font-semibold` (600).
- **Nội dung thân (Body):** `14px - 15px`, `font-normal` (400), line-height `1.6`.
- **Nhãn / Nút:** `13px - 14px`, `font-semibold` (600).
- **Số giờ / Giá tiền:** `font-variant-numeric: tabular-nums` kèm `font-bold`.

---

## 2. Bảng Màu Thương Hiệu (Brand Color Palette)

| Vai trò | Mã Màu HEX | Biến CSS / Tailwind Class | Mục đích sử dụng |
| :--- | :--- | :--- | :--- |
| **Xanh chủ đạo (Sage)** | `#2D5A27` | `--med-sage` / `bg-sage-600` | Nút hành động chính, nút đặt lịch, viền active, icon |
| **Xanh hover** | `#274D23` | `hover:bg-sage-700` | Hiệu ứng hover các nút chính |
| **Xanh rừng đậm (Forest)** | `#193723` | `--med-forest` / `bg-sage-900` | Tiêu đề lớn, nền footer, thanh header đậm |
| **Nền sage dịu (Tint)** | `#EAF0E5` | `--med-tint` / `bg-sage-50` | Nền hero banner, badge đã hoàn thành |
| **Màu nhấn (Coral)** | `#E07A5F` | `--med-coral` | Gạch chân tab tìm kiếm đang chọn, điểm nhấn phụ |
| **Nền trang (Paper)** | `#F9FBF8` | `--med-paper` / `bg-slate-50` | Nền toàn trang web |
| **Bề mặt (Surface)** | `#FFFFFF` | `bg-white` | Thẻ card, modal, khung nhập liệu |
| **Chữ chính (Ink)** | `#1F2937` | `--med-ink` / `text-slate-900` | Văn bản chính, tiêu đề |
| **Chữ phụ (Muted)** | `#526154` | `--med-muted` / `text-slate-500` | Mô tả phụ, nhãn tóm tắt |
| **Đường kẻ / Viền (Line)**| `#D7DFD4` | `--med-line` / `border-slate-200` | Đường phân cách, viền ô nhập |

---

## 3. Banner & Nhận Diện Hình Ảnh (Banner & Assets)

- **Ảnh Banner chính (Hero Banner):** Sử dụng file `frontend/src/assets/consultation.jpg` (cũng được lưu dự phòng tại `frontend/src/assets/medsi-banner.jpg` và `frontend/public/media/banner.jpg`).
- **Nội dung ảnh:** Tác phẩm flat-lay y tế chuẩn nhận diện MedSi gồm ống nghe xanh Sage, thẻ bác sĩ MedSi, điện thoại hiển thị lịch khám, sổ tay MedSi, đồng hồ đo nhịp tim và logo MedSi chính giữa.
- **Cách áp dụng:**
  ```jsx
  import photo from '@/assets/consultation.jpg'
  <img src={photo} alt="MedSi Banner" className="w-full h-full object-cover object-center" />
  ```
