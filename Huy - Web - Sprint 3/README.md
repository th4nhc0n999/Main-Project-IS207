# GÓI BÀN GIAO PHÂN TÍCH THIẾT KẾ (PTTK) — MIỀN UI & UX (SPRINT 3)

- **Dự án:** MedSi — Đặt lịch khám bệnh trực tuyến (IS207)
- **Phân hệ phụ trách:** Giao diện & Trải nghiệm Người dùng (`UI — User Interface & UX`)
- **Người thực hiện:** **Huy Nguyễn Quốc**
- **Thời hạn (Deadline):** 08/10/2026 ➔ 15/10/2026
- **Quy chuẩn định dạng:** Đồng bộ 100% theo mẫu của phân hệ BKD (`Bảo - Web - Sprint 3`)

---

## 📑 Bảng Đối Chiếu 12 Mục Output Register Phân Hệ UI & UX

| STT | Phân mục Yêu cầu (Notion) | Mã định danh | Tên file Word & Markdown | Tài liệu Excel / Thư mục tương ứng | Vị trí & Nội dung chi tiết |
| :---: | :--- | :---: | :--- | :--- | :--- |
| **1** | **Business Description** | `UI_DOC` | [UI_DOC.docx](UI_DOC.docx) | — | Mục 1: Mô tả bài toán giảm tải xếp hàng, phễu 3 bước, khóa slot 10p, Near-me |
| **2** | **Actors & User Journeys** | `Actor / Journeys` | [UI_DOC.docx](UI_DOC.docx) | — | Mục 2: Bảng 3 Actor & Use case; Mục 3.1: Luồng trải nghiệm 3 bước |
| **3** | **Competitor Benchmark** | `UI_BENCH` | [UI_BENCH.docx](UI_BENCH.docx) & [UI_BENCH.md](UI_BENCH.md) | Tab `UI_CMP` trong [Excel](UI_DS_UI_BR_UI_CMP_UI_OQ.xlsx) | Đánh giá Benchmark 12 tiêu chí, MedSi đạt 9.12/10 điểm so với 3 đối thủ |
| **4** | **Design System** | `UI_DS` | [UI_DS.docx](UI_DS.docx) & [UI_DS.md](UI_DS.md) | Tab `UI_DS` trong [Excel](UI_DS_UI_BR_UI_CMP_UI_OQ.xlsx) | Design Tokens bảng màu Sky Blue, typography Plus Jakarta Sans, button, input |
| **5** | **Sitemap** | `UI_SITEMAP` | — | Thư mục [UI_SITEMAP/](UI_SITEMAP/) | Sơ đồ cây phân cấp kiến trúc thông tin trang web MedSi ([UI_SITEMAP_01.png](UI_SITEMAP/UI_SITEMAP_01.png)) |
| **6** | **Wireframes** | `UI_WF` | — | Thư mục [UI_WF/](UI_WF/) | 6 bản vẽ khung nét cao: `UI_WF_01.png` ➔ `UI_WF_06.png` (Home, Search, Detail, Confirm, Pay, Bookings) |
| **7** | **Near-me** | `ACT-UI-01` / `UI_NEAR` | [Đặc tả Near-me.md](Đặc%20tả%20Near-me.md) | [UI_ACT/ACT-UI-01.png](UI_ACT/ACT-UI-01.png) & [UI_NEAR/](UI_NEAR/) | Sơ đồ quy trình cấp quyền Geolocation, Haversine km, Fallback chọn quận & Thư mục ảnh chụp màn hình GPS live |
| **8** | **Business Rules** | `UI_BR` | [UI_BR.docx](UI_BR.docx) & [UI_BR.md](UI_BR.md) | Tab `UI_BR` trong [Excel](UI_DS_UI_BR_UI_CMP_UI_OQ.xlsx) | Đặc tả 25 quy tắc nghiệp vụ logic giao diện `BR-UI-01` ➔ `BR-UI-25` theo chuẩn A6 |
| **9** | **Competitor Comparison** | `UI_CMP` | [UI_CMP.docx](UI_CMP.docx) & [UI_CMP.md](UI_CMP.md) | Tab `UI_CMP` trong [Excel](UI_DS_UI_BR_UI_CMP_UI_OQ.xlsx) | Ma trận so sánh 12 tiêu chí chi tiết giữa MedSi, YouMed, Medpro, BookingCare |
| **10** | **Web UI Specification** | `UI_WEB` | [UI_WEB.docx](UI_WEB.docx) | — | Đặc tả SPA React 19, Mobile-First, Responsive Breakpoints, Skeleton Shimmer, WCAG 2.1 AA |
| **11** | **Open Questions** | `UI_OQ` | [UI_OQ.docx](UI_OQ.docx) & [UI_OQ.md](UI_OQ.md) | Tab `UI_OQ` trong [Excel](UI_DS_UI_BR_UI_CMP_UI_OQ.xlsx) | 15 câu hỏi mở kèm phương án đề xuất mặc định, phân tích tác động và phân công chốt |
| **12** | **Sources** | `Sources` | [Sources.docx](Sources.docx) & [Sources.md](Sources.md) | [UI_Resources.docx](UI_Resources.docx) | Trích dẫn W3C Geolocation, Haversine 1984, WCAG 2.1 AA, Napas VietQR, YouMed, Medpro |

---

## 📦 Danh Mục Toàn Bộ Các File Bàn Giao Trong Gói

### 1. Tài liệu Word (`.docx`) & Báo cáo Markdown (`.md`):
- **[`UI_DOC.docx`](UI_DOC.docx)**: Tài liệu phân tích nghiệp vụ tổng thể miền UI (Format chuẩn A4 theo mẫu BKD).
- **[`UI_Resources.docx`](UI_Resources.docx)**: Tài liệu tài nguyên, danh mục đối chiếu, phân công giữa các miền.
- **[`UI_BR.docx`](UI_BR.docx) & [`UI_BR.md`](UI_BR.md)**: Đặc tả chi tiết 25 quy tắc nghiệp vụ giao diện (UI Business Rules).
- **[`UI_DS.docx`](UI_DS.docx) & [`UI_DS.md`](UI_DS.md)**: Đặc tả Design System Tokens (Typography, Color Palette, Atomic Components).
- **[`UI_BENCH.docx`](UI_BENCH.docx) & [`UI_BENCH.md`](UI_BENCH.md)**: Đo lường Benchmark đối thủ cạnh tranh (MedSi đạt 9.12/10).
- **[`UI_CMP.docx`](UI_CMP.docx) & [`UI_CMP.md`](UI_CMP.md)**: Ma trận so sánh 12 tiêu chí UX/UI đối thủ cạnh tranh.
- **[`UI_WEB.docx`](UI_WEB.docx) & [`UI_WEB.md`](UI_WEB.md)**: Đặc tả kỹ thuật kiến trúc giao diện Web (Mobile-First, WCAG 2.1 AA, Shimmer).
- **[`UI_OQ.docx`](UI_OQ.docx) & [`UI_OQ.md`](UI_OQ.md)**: Danh mục 15 câu hỏi mở kèm đề xuất chốt.
- **[`Sources.docx`](Sources.docx) & [`Sources.md`](Sources.md)**: Danh mục nguồn tham chiếu học thuật và tiêu chuẩn kỹ thuật quốc tế.

### 2. Bảng tính Excel tổng hợp (`.xlsx`):
- **[`UI_DS_UI_BR_UI_CMP_UI_OQ.xlsx`](UI_DS_UI_BR_UI_CMP_UI_OQ.xlsx)** gồm 4 tab chuẩn hóa:
  - `UI_DS`: Tokens hệ thống thiết kế.
  - `UI_BR`: 25 quy tắc nghiệp vụ logic giao diện.
  - `UI_CMP`: Đo lường Benchmark và so sánh đối thủ.
  - `UI_OQ`: 15 câu hỏi mở cần chốt.

### 3. Thư mục sơ đồ, bản vẽ & ảnh nghiệm thu:
- **[`UI_ACT/`](UI_ACT/)**: Chứa duy nhất 1 sơ đồ hoạt động **[`ACT-UI-01.png`](UI_ACT/ACT-UI-01.png)** cho quy trình định vị Near-me.
- **[`UI_WF/`](UI_WF/)**: Chứa 6 ảnh Wireframe `UI_WF_01.png` đến `UI_WF_06.png` độ phân giải cao 1200x850.
- **[`UI_SITEMAP/`](UI_SITEMAP/)**: Chứa ảnh sơ đồ kiến trúc trang **[`UI_SITEMAP_01.png`](UI_SITEMAP/UI_SITEMAP_01.png)**.
- **[`UI_NEAR/`](UI_NEAR/)**: Thư mục lưu trữ ảnh chụp màn hình thực tế tính năng định vị GPS Near-me trên web app MedSi đang chạy live.
