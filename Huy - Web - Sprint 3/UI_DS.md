# Hệ Thống Thiết Kế Giao Diện (Design System — UI_DS)

- **Mã phân hệ:** `UI_DS`
- **Người phụ trách:** Huy Nguyễn Quốc
- **Nguồn hiện thực:** Đồng bộ từ mã nguồn Frontend (`frontend/tailwind.config.js` & `frontend/src/index.css`)
- **Ngày cập nhật:** 15/10/2026

---

## 1. Hệ Thống Phông Chữ (Typography)
- **Phông chữ chuẩn:** `Plus Jakarta Sans`, phông dự phòng `Inter`, `sans-serif`.
- **Cấu hình:** `font-sans` hỗ trợ 100% tiếng Việt, tạo nét y tế hiện đại, chuyên nghiệp.

| Cấp bậc | Kích thước & Dòng | Độ đậm | Tailwind Class | Vị trí áp dụng |
| :--- | :--- | :---: | :--- | :--- |
| **Hero Title** | 36px - 40px / 44px | 700 (Bold) | `text-4xl font-bold` | Tiêu đề banner trang chủ |
| **Heading 1 (H1)** | 28px - 32px / 36px | 700 (Bold) | `text-3xl font-bold` | Tiêu đề chi tiết bác sĩ, tìm kiếm |
| **Heading 2 (H2)** | 22px - 24px / 28px | 600 (SemiBold) | `text-2xl font-semibold` | Tiêu đề phân khối (Chuyên khoa, Ca khám) |
| **Heading 3 (H3)** | 18px - 20px / 24px | 600 (SemiBold) | `text-xl font-semibold` | Tên bác sĩ trên thẻ Card, Modal title |
| **Body Regular** | 14px - 15px / 20px | 400 (Regular) | `text-sm` | Mô tả bác sĩ, địa chỉ, ô nhập liệu |
| **Body Medium** | 14px - 15px / 20px | 500 (Medium) | `text-sm font-medium` | Nhãn form, văn bản nút bấm CTA |
| **Caption / Tag** | 12px / 16px | 500 (Medium) | `text-xs font-medium` | Khoảng cách km Near-me, giờ slot |

---

## 2. Bảng Màu Y Tế (Color Palette)

### 2.1 Bảng màu chính (Brand Primary — Sky Blue)
- `primary-50` (`#f0f9ff`), `primary-100` (`#e0f2fe`): Nền badge nhẹ nhàng.
- `primary-500` (`#0088cc`): Màu thương hiệu đặc trưng phong cách y tế YouMed.
- `primary-600` (`#0284c7`): **Màu nút hành động chính (Main CTA)**.
- `primary-700` (`#0369a1`): Trạng thái hover của nút bấm chính.
- `primary-900` (`#0c4a6e`): Thanh Navbar và tiêu đề đậm y khoa.

### 2.2 Bảng màu trạng thái (Status Colors)
- **Health / Success (Emerald):** `health-500` (`#10b981`), nền `health-50` (`#ecfdf5`) ➔ Dành cho Slot còn trống (Available), đã duyệt, thanh toán thành công.
- **Warning / Hold (Amber):** `amber-500` (`#f59e0b`) ➔ Dành cho đồng hồ đếm ngược giữ slot 10:00 phút.
- **Destructive (Rose):** `destructive` (`#ef4444`) ➔ Slot đã đầy (Full), đã hủy lịch, báo lỗi validate.
- **Neutral (Slate):** Nền ứng dụng `bg-background` (`#f8fafc`), chữ `text-foreground` (`#0f172a`), viền `border` (`#e2e8f0`).

---

## 3. Quy Chuẩn Thành Phần Giao Diện (Components)
- **Bo góc (Radius):** `--radius: 0.625rem` (10px). Các Card và Nút dùng bo góc tròn trịa, thân thiện.
- **Độ đổ bóng (Shadows):**
  - `shadow-medical`: Hiệu ứng bóng xanh nhạt đặc trưng y tế, tạo chiều sâu nhẹ nhàng.
  - `shadow-card-hover`: Hiệu ứng nổi bật khi rê chuột vào thẻ bác sĩ.
- **Nút bấm (Buttons):** Chiều cao tối thiểu 44px (`h-11 px-6 rounded-lg`) theo chuẩn ngón tay bấm trên thiết bị di động.
- **Khung giờ khám (Slot Pill Buttons — 3 trạng thái):**
  - *Khả dụng (Available):* Viền xanh lá, nền trắng, đổi màu khi hover.
  - *Đang chọn (Selected):* Nền xanh dương đậm chữ trắng, có icon check.
  - *Đã đầy (Full):* Nền xám mờ, chữ gạch ngang, con trỏ cấm `cursor-not-allowed`.

---

## 4. Breakpoints Đáp Ứng (Responsive)
- **Mobile (< 640px):** 1 cột dọc 100%, phím bấm lớn, menu dạng ngăn kéo Bottom Drawer.
- **Tablet (640px - 1023px):** Lưới 2 cột linh hoạt.
- **Desktop (>= 1024px):** Lưới 12 cột chuẩn, container tối đa 1280px (`2xl`), phân chia 70% danh sách và 30% sidebar cố định.
