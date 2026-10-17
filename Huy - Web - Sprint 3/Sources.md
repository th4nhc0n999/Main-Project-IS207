# DANH MỤC NGUỒN TÀI NGUYÊN & TRÍCH DẪN (SOURCES)

- **Dự án:** MedSi — Đặt lịch khám bệnh trực tuyến (IS207)
- **Phân hệ:** Giao diện & Trải nghiệm Người dùng (`UI — User Interface & UX`)
- **Người thực hiện:** **Huy Nguyễn Quốc**
- **Ngày hoàn thành:** 15/10/2026

---

## 📑 1. Bảng Danh Mục Các Nguồn Tham Khảo Chính Thức

| Mã | Tên tài liệu / Tiêu chuẩn / Tổ chức | Tác giả / Cơ quan | Đường dẫn tham chiếu (URL) | Mục đích áp dụng cho MedSi |
| :---: | :--- | :--- | :--- | :--- |
| **SRC-01** | W3C Geolocation API Specification | World Wide Web Consortium (W3C) | [https://www.w3.org/TR/geolocation/](https://www.w3.org/TR/geolocation/) | Quy chuẩn giao tiếp phần cứng GPS và Geolocation API trình duyệt |
| **SRC-02** | Web Content Accessibility Guidelines (WCAG) 2.1 AA | W3C Web Accessibility Initiative (WAI) | [https://www.w3.org/TR/WCAG21/](https://www.w3.org/TR/WCAG21/) | Tiêu chuẩn độ tương phản màu (>= 4.5:1), touch target 44px và điều hướng phím Tab |
| **SRC-03** | Công thức Lượng giác Mặt cầu Haversine (Haversine Formula) | R.W. Sinnott (Sky & Telescope 1984) | [https://en.wikipedia.org/wiki/Haversine_formula](https://en.wikipedia.org/wiki/Haversine_formula) | Thuật toán tính khoảng cách đại vòng tròn giữa 2 tọa độ GPS bán kính R=6371km |
| **SRC-04** | Tiêu chuẩn Thanh toán VietQR Napas 247 | Công ty Cổ phần Thanh toán Quốc gia VN (NAPAS) | [https://vietqr.net/](https://vietqr.net/) | Quy chuẩn tạo mã QR thanh toán liên ngân hàng tự động kèm số tiền và nội dung |
| **SRC-05** | Khảo sát Nền tảng Đặt khám YouMed Việt Nam | Công ty Cổ phần YouMed Việt Nam | [https://youmed.vn/](https://youmed.vn/) | Khảo sát luồng đặt khám bác sĩ, chuyên khoa, phòng khám và quản lý hồ sơ bệnh nhân |
| **SRC-06** | Khảo sát Ứng dụng Y tế Medpro | Công ty Cổ phần Mạng Lưới Y Tế Medpro | [https://medpro.vn/](https://medpro.vn/) | Khảo sát quy trình đặt số thứ tự tại các bệnh viện công lập lớn tại TP.HCM |
| **SRC-07** | Khảo sát Nền tảng Chăm sóc Sức khỏe BookingCare | Công ty Cổ phần Công nghệ BookingCare | [https://bookingcare.vn/](https://bookingcare.vn/) | Khảo sát danh mục gói khám tổng quát, thông tin tiểu sử bác sĩ và chi phí niêm yết |
| **SRC-08** | Tài liệu Kỹ thuật React 19 & Component Architecture | Meta Open Source | [https://react.dev/](https://react.dev/) | Mô hình Single Page Application, hooks (useState, useMemo, useEffect) và component-driven |
| **SRC-09** | Tailwind CSS Documentation & Design Tokens | Tailwind Labs Inc. | [https://tailwindcss.com/docs](https://tailwindcss.com/docs) | Hệ thống lớp tiện ích utility-first, tokens màu sắc, spacing và responsive breakpoints |
| **SRC-10** | Bộ Biểu tượng Y tế & Giao diện Lucide React | Lucide Contributors | [https://lucide.dev/](https://lucide.dev/) | Hệ thống SVG icons vector sắc nét, tối ưu hiệu năng và hỗ trợ accessibility |
| **SRC-11** | Tài liệu Hướng dẫn Thiết kế Y tế (Healthcare UX Guidelines) | Nielsen Norman Group (NN/g) | [https://www.nngroup.com/articles/healthcare-ux/](https://www.nngroup.com/articles/healthcare-ux/) | Nguyên tắc thiết kế form y tế đơn giản, giảm tải áp lực tâm lý cho bệnh nhân |
| **SRC-12** | Google Fonts — Phông chữ Plus Jakarta Sans | Tokotype & Gumpita Rahayu | [https://fonts.google.com/specimen/Plus+Jakarta+Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans) | Phông chữ hình học hiện đại, hỗ trợ 100% Unicode tiếng Việt chuẩn mực y tế |

---

## 🔬 2. Tổng Hợp Đóng Góp Theo Lĩnh Vực

### 2.1. Định vị & Toán học mặt cầu
- **W3C Geolocation API:** Chuẩn gọi tọa độ GPS trình duyệt an toàn.
- **Haversine Formula (R=6371km):** Đo khoảng cách thực tế giữa người bệnh và cơ sở y tế với sai số < 0.3%.

### 2.2. Trợ năng & Trải nghiệm người dùng y tế
- **WCAG 2.1 AA:** Đảm bảo độ tương phản chữ $\ge 4.5:1$, touch target 44px, hỗ trợ điều hướng bàn phím Tab.
- **Nielsen Norman Group Healthcare UX:** Giảm áp lực tâm lý cho người đi khám, thiết kế form đơn giản.

### 2.3. Khảo sát thực tế & Tiêu chuẩn thanh toán
- **YouMed, Medpro, BookingCare:** Khảo sát đối chuẩn thực tế ngày 16/10/2026.
- **VietQR Napas 247:** Tạo mã QR thanh toán tự động, chuẩn xác và tức thì.