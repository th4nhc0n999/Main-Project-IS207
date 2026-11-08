# Báo Cáo Phân Tích & Đặc Tả Miền Quản Trị (Administration Domain - ADM)

> **Dự án:** MedSi — Hệ thống đặt lịch khám bệnh trực tuyến (Đồ án IS207)  
> **Phân hệ phụ trách:** Quản trị hệ thống (Administration Domain - ADM)  
> **Thời điểm cập nhật:** 06/11/2026 (Đồng bộ theo Baseline v1.0 & Sprint 4)  
> **Tài liệu tham chiếu:** Tài liệu thống nhất v1.0, schema v1.1 (`medsi_schema_v1.sql`), Output Register CMN

---

## MỤC LỤC
1. [1. Mô tả nghiệp vụ](#1-mô-tả-nghiệp-vụ)
2. [2. Actor và Use Case](#2-actor-và-use-case)
   - [2.1. Xác định Actor](#21-xác-định-actor)
   - [2.2. Danh sách Use Case miền Administration (UC-ADM-nn)](#22-danh-sách-use-case-miền-administration-uc-adm-nn)
   - [2.3. Sơ đồ Use Case (Text-Art)](#23-sơ-đồ-use-case-text-art)
3. [3. Luồng chính và luồng ngoại lệ cho từng Use Case](#3-luồng-chính-và-luồng-ngoại-lệ-cho-từng-use-case)
   - [3.1. UC-ADM-01: Quản lý Chuyên khoa (Specialty)](#31-uc-adm-01-quản-lý-chuyên-khoa-specialty)
   - [3.2. UC-ADM-02: Quản lý Hồ sơ Bác sĩ (Doctor)](#32-uc-adm-02-quản-lý-hồ-sơ-bác-sĩ-doctor)
   - [3.3. UC-ADM-03: Quản trị Khung giờ khám (Slot)](#33-uc-adm-03-quản-trị-khung-giờ-khám-slot)
   - [3.4. UC-ADM-04: Quản lý & Điều phối Lịch hẹn (Booking & No-Show)](#34-uc-adm-04-quản-lý--điều-phối-lịch-hẹn-booking--no-show)
   - [3.5. UC-ADM-05: Quản lý & Đối soát Hoàn tiền (Refund Console)](#35-uc-adm-05-quản-lý--đối-soát-hoàn-tiền-refund-console)
   - [3.6. UC-ADM-06: Xem Báo cáo & Thống kê Vận hành (Reports & Analytics)](#36-uc-adm-06-xem-báo-cáo--thống-kê-vận-hành-reports--analytics)
   - [3.7. UC-ADM-07: Quản trị Chế độ Demo & Dữ liệu mẫu (Sandbox / Demo Mode)](#37-uc-adm-07-quản-trị-chế-độ-demo--dữ-liệu-mẫu-sandbox--demo-mode)
4. [4. Workflow màn hình Admin (ADM_WF)](#4-workflow-màn-hình-admin-adm_wf)
   - [4.1. Sơ đồ luồng màn hình tổng thể](#41-sơ-đồ-luồng-màn-hình-tổng-thể)
   - [4.2. Danh mục màn hình quản trị (Screen Catalog)](#42-danh-mục-màn-hình-quản-trị-screen-catalog)
   - [4.3. Đặc tả 4 luồng màn hình tương tác chi tiết](#43-đặc-tả-4-luồng-màn-hình-tương-tác-chi-tiết)
5. [5. Nhóm Báo cáo & Thống kê Phân tích (ADM_RPT)](#5-nhóm-báo-cáo--thống-kê-phân-tích-adm_rpt)
6. [6. Catalog Quản trị & Sơ đồ Cấu trúc Danh mục (ADM_CAT)](#6-catalog-quản-trị--sơ-đồ-cấu-trúc-danh-mục-adm_cat)
7. [7. Business Rules miền Administration (ADM_BR)](#7-business-rules-miền-administration-adm_br)
8. [8. So sánh với đối thủ cạnh tranh (ADM_CMP)](#8-so-sánh-với-đối-thủ-cạnh-tranh-adm_cmp)
9. [9. Quản trị rủi ro & Các câu hỏi mở (OQ-ADM-nn)](#9-quản-trị-rủi-ro--các-câu-hỏi-mở-oq-adm-nn)
10. [10. Nguồn tham khảo (References)](#10-nguồn-tham-khảo-references)

---

## 1. Mô tả nghiệp vụ

Phân hệ **Administration (Quản trị viên - ADM)** đóng vai trò là hạt nhân vận hành, điều phối toàn bộ tài nguyên y tế và các luồng giao dịch trên nền tảng MedSi. Nghiệp vụ quản trị tập trung vào 6 nhóm trách nhiệm cốt lõi:

* **Quản trị danh mục dữ liệu y tế nền tảng (Master Catalog):** Chuẩn hóa danh mục 14 Chuyên khoa (bắt buộc `CK03` = Tim mạch), Bệnh viện tại 2 khu vực địa lý có tọa độ GPS, Hồ sơ Bác sĩ (học vị, kinh nghiệm, biểu phí 150.000đ – 500.000đ) và Gói loại khám (`exam_types`). Hỗ trợ cơ chế xóa mềm (`SoftDeletes`) và chặn xóa khi còn lịch hẹn hoạt động.
* **Hoạch định năng lực phục vụ (Capacity Planning):** Khởi tạo, sinh ca khám hàng loạt theo dải ngày/giờ, quản lý ca khám đa hình (`doctor` hoặc `hospital`), bật/tắt khóa ca khám (`blocked`) khẩn cấp.
* **Điều phối lịch hẹn & Xử lý vắng mặt (Booking Governance & No-Show):** Giám sát trạng thái phiếu hẹn, duyệt/hủy lịch hẹn, giải phóng slot bị treo (`lockForUpdate`), và thực thi kịch bản **E12**: xác nhận ghi vắng (`T11` $\rightarrow$ `no_show`, hủy vé `expired`, hoàn 0đ, xử lý khiếu nại).
* **Quản lý tài chính & Bàn điều khiển hoàn tiền (Refund Console):** Tiếp nhận yêu cầu hoàn tiền tự động sinh ra từ các sự kiện T06, T07, T08, T10, T13, T16; xét duyệt theo chính sách 14 dòng hoàn tiền; thực hiện giải ngân mô phỏng sang `succeeded`, bảo toàn ràng buộc `refunded_amount <= received_amount`.
* **Báo cáo phân tích kinh doanh (Business Intelligence):** Cung cấp 4 báo cáo vận hành chuẩn theo quyết định **DL-25 / CF-53**: 9 trạng thái lịch hẹn, Doanh thu ròng (Tổng thu thành công − Tổng hoàn thành công), Tỷ lệ hủy theo nguyên nhân, và Xếp hạng Bác sĩ/Chuyên khoa.
* **Chế độ Demo Sandbox (Demo Mode):** Giả lập thanh toán thành công (`payment_transactions.source = demo_admin`), duyệt/từ chối lịch khám thay bác sĩ (T05/T06), ghi nhận đầy đủ sự kiện kiểm toán **`AU-17`** phục vụ đào tạo và bảo vệ đồ án.

---

## 2. Actor và Use Case

### 2.1. Xác định Actor
* **Quản trị viên hệ thống (Admin):** Người đại diện vận hành nền tảng, có tài khoản với quyền `role: admin`. Có toàn quyền truy cập các endpoint `/api/admin/*` và các giao diện quản trị.
* **Nhân viên cơ sở (Staff - Hỗ trợ):** Tài khoản `role: staff` bắt buộc gắn `hospital_id`, chỉ thao tác tiếp nhận và quét QR check-in tại cơ sở được phân công.

### 2.2. Danh sách Use Case miền Administration (UC-ADM-nn)
Tuân thủ quyết định chuẩn hóa mã **DL-21 / CF-57**, danh mục Use Case của Quản trị viên gồm đúng **7 Use Case thực tế**:

| Mã UC | Tên Use Case | Mục tiêu nghiệp vụ của Admin |
| :--- | :--- | :--- |
| **UC-ADM-01** | Quản lý Chuyên khoa (Specialty) | Quản lý danh mục 14 chuyên khoa, tự sinh slug, thiết lập chỉ dẫn khám ban đầu |
| **UC-ADM-02** | Quản lý Hồ sơ Bác sĩ & Bệnh viện (Doctor & Hospital) | Quản lý thông tin bác sĩ, biểu phí (150k - 500k), tọa độ địa lý; quản lý bệnh viện |
| **UC-ADM-03** | Quản trị Khung giờ khám (Slot) | Sinh slot hàng loạt 7 ngày tới, quản trị trạng thái (available, full, blocked), kiểm soát sức chứa |
| **UC-ADM-04** | Quản lý & Điều phối Lịch hẹn (Booking & No-Show) | Điều phối lịch hẹn, giải phóng slot treo, xác nhận ghi vắng No-show (E12), giải quyết khiếu nại |
| **UC-ADM-05** | Quản trị Hoàn tiền (Refund Console) | Tra cứu yêu cầu hoàn tiền, duyệt/từ chối theo chính sách 14 dòng, giải ngân mô phỏng |
| **UC-ADM-06** | Xem Báo cáo & Thống kê Vận hành (Reports) | Xem 4 báo cáo: 9 trạng thái lịch, Doanh thu ròng, Tỷ lệ hủy theo lý do, Top Bác sĩ/Chuyên khoa |
| **UC-ADM-07** | Quản trị Chế độ Demo (Sandbox) | Giả lập thanh toán thành công (`source=demo_admin`), duyệt thay bác sĩ, ghi nhận log `AU-17` |

---

### 2.3. Sơ đồ Use Case (Text-Art)

```text
                             HỆ THỐNG MEDSI — PHÂN HỆ QUẢN TRỊ (ADM)
                     ┌─────────────────────────────────────────────────────────────┐
                     │ [BOUNDARY 1: CATALOG & CAPACITY PLANNING]                   │
                     │   ┌─────────────────────────────────────────────────────┐   │
                     │ ┌─┤ UC-ADM-01: Quản lý Chuyên khoa (Specialty)          │   │
                     │ │ └─────────────────────────────────────────────────────┘   │
                     │ │ ┌─────────────────────────────────────────────────────┐   │
                     │ ├─┤ UC-ADM-02: Quản lý Bác sĩ & Bệnh viện (Doctor/Hosp) │   │
                     │ │ └─────────────────────────────────────────────────────┘   │
                     │ │ ┌─────────────────────────────────────────────────────┐   │
                     │ ├─┤ UC-ADM-03: Quản trị Khung giờ khám (Slot)           │   │
       o             │ │ └─────────────────────────────────────────────────────┘   │
      /|\   ─────────┼─┤                                                           │
      / \            │ │ [BOUNDARY 2: GOVERNANCE, FINANCE & BUSINESS INTELLIGENCE] │
    ADMIN            │ │ ┌─────────────────────────────────────────────────────┐   │
(Quản trị viên)      │ ├─┤ UC-ADM-04: Quản lý Lịch hẹn & No-Show (Booking)     │   │
                     │ │ └─────────────────────────────────────────────────────┘   │
                     │ │ ┌─────────────────────────────────────────────────────┐   │
                     │ ├─┤ UC-ADM-05: Quản trị Hoàn tiền (Refund Console)      │   │
                     │ │ └─────────────────────────────────────────────────────┘   │
                     │ │ ┌─────────────────────────────────────────────────────┐   │
                     │ ├─┤ UC-ADM-06: Xem Báo cáo & Thống kê (ADM_RPT)         │   │
                     │ │ └─────────────────────────────────────────────────────┘   │
                     │ │ ┌─────────────────────────────────────────────────────┐   │
                     │ └─┤ UC-ADM-07: Quản trị Chế độ Demo (Sandbox)           │   │
                     │   └─────────────────────────────────────────────────────┘   │
                     └─────────────────────────────────────────────────────────────┘
```

---

## 3. Luồng chính và luồng ngoại lệ cho từng Use Case

### 3.1. UC-ADM-01: Quản lý Chuyên khoa (Specialty)
* **Luồng chính:** Admin xem danh sách chuyên khoa, tạo mới, chỉnh sửa thông tin mô tả, chỉ dẫn khám. Hệ thống tự động tạo slug chuẩn SEO.
* **Luồng ngoại lệ (EX-ADM-01):** Nếu chuyên khoa đang có bác sĩ hoạt động hoặc có slot/lịch hẹn liên kết, hệ thống chặn xóa và trả về HTTP 422: *"Chuyên khoa đang có bác sĩ hoạt động, không thể xóa!"*.

### 3.2. UC-ADM-02: Quản lý Hồ sơ Bác sĩ (Doctor)
* **Luồng chính:** Admin thiết lập hồ sơ bác sĩ, phân bổ chuyên khoa, liên kết `users.id`, cấu hình biểu phí (150.000đ – 500.000đ) và tọa độ địa lý. Hỗ trợ xóa mềm (`SoftDeletes`).
* **Luồng ngoại lệ (EX-ADM-02 / BR-ADM-01):** Khi bấm xóa bác sĩ, nếu bác sĩ đang có lịch ở trạng thái `pending_payment`, `pending_approval` hoặc `confirmed`, hệ thống từ chối (HTTP 422): *"Bác sĩ đang có lịch khám chưa hoàn tất, không thể xóa khỏi hệ thống!"*.

### 3.3. UC-ADM-03: Quản trị Khung giờ khám (Slot)
* **Luồng chính:** Admin sinh slot theo dải ngày giờ hoặc điều chỉnh sức chứa (`capacity`). Hỗ trợ thao tác bật/tắt khóa ca khám khẩn cấp (`toggleBlock`).
* **Luồng ngoại lệ (EX-ADM-03 / BR-ADM-02):** Chặn xóa hoặc sửa đổi giờ khám nếu ca khám đã có người đặt (`booked_count > 0`).

### 3.4. UC-ADM-04: Quản lý & Điều phối Lịch hẹn (Booking & No-Show)
* **Luồng chính:** Admin tra cứu danh sách lịch hẹn, thực hiện duyệt/hủy hộ khi bệnh nhân yêu cầu (T08, T10), giải phóng slot bị kẹt (`lockForUpdate`).
* **Kịch bản E12 (Không đến khám):**
  1. Hệ thống lọc danh sách đủ điều kiện ghi vắng (bác sĩ quá 15 phút sau giờ bắt đầu slot, bệnh viện quá 120 phút sau giờ kết thúc ca mà vé chưa quét check-in).
  2. Admin bấm xác nhận ghi vắng (sự kiện `T11`): `bookings.status = 'no_show'`, `tickets.status = 'expired'`, hoàn tiền 0đ (theo dòng 12), ghi nhật ký kiểm toán với actor là Admin.
  3. Xử lý khiếu nại: Nếu bệnh nhân có lý do chính đáng (cấp cứu, bất khả kháng), Admin chấp thuận khiếu nại và chủ động tạo lệnh hoàn 100% phí khám.

### 3.5. UC-ADM-05: Quản trị Hoàn tiền (Refund Console)
* **Luồng chính:** Tiếp nhận các yêu cầu hoàn tiền tự động sinh ra từ hệ thống. Admin duyệt (`approved`) hoặc từ chối (`rejected`) theo chính sách 14 dòng hoàn tiền. Thực hiện giải ngân mô phỏng: chuyển từ `approved`/`processing` $\rightarrow$ `succeeded`, cập nhật `payments.refunded_amount`.
* **Luồng ngoại lệ (EX-ADM-05):** Chặn giải ngân nếu số tiền hoàn vượt quá số tiền thực thu (`refunded_amount > received_amount`).

### 3.6. UC-ADM-06: Xem Báo cáo & Thống kê Vận hành (Reports & Analytics)
* **Luồng chính:** Admin xem Dashboard và 4 báo cáo thống kê vận hành thời gian thực hỗ trợ ra quyết định.

### 3.7. UC-ADM-07: Quản trị Chế độ Demo & Dữ liệu mẫu (Sandbox / Demo Mode)
* **Luồng chính:** 
  1. Admin giả lập thanh toán thành công cho lịch `pending_payment`: ghi nhận `payment_transactions.source = 'demo_admin'`, chuyển trạng thái sang `pending_approval` hoặc `confirmed`, ghi nhận kiểm toán `AU-17`.
  2. Admin duyệt hoặc từ chối thay bác sĩ (T05/T06) trong môi trường demo/bảo vệ đồ án, ghi nhận kiểm toán `AU-17`.

---

## 4. Workflow màn hình Admin (ADM_WF)

### 4.1. Sơ đồ luồng màn hình tổng thể

```text
               ┌──────────────────────────────┐
               │    SCR-ADM-01: Đăng nhập     │
               └──────────────┬───────────────┘
                              │ Đăng nhập role = admin
                              ▼
               ┌──────────────────────────────┐
               │     Layout Quản Trị Chung    │
               │    (Header & Side Navigation)│
               └──────────────┬───────────────┘
                              │
       ┌──────────────────────┼──────────────────────┬──────────────────────┐
       ▼                      ▼                      ▼                      ▼
┌──────────────┐       ┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│  SCR-ADM-02  │       │  SCR-ADM-03  │       │  SCR-ADM-04  │       │  SCR-ADM-05  │
│ Master Data  │       │   Booking &  │       │    Refund    │       │   Operating  │
│   Catalog    │       │ No-Show (E12)│       │    Console   │       │    Reports   │
└──────────────┘       └──────────────┘       └──────────────┘       └──────────────┘
```

### 4.2. Danh mục màn hình quản trị (Screen Catalog)

| Mã màn hình | Tên màn hình / URL | Mục đích & Chức năng chính |
| :---: | :--- | :--- |
| **SCR-ADM-01** | Đăng nhập hệ thống (`/login`) | Xác thực tài khoản quản trị viên (`role = admin`) |
| **SCR-ADM-02** | Quản lý Catalog Master Data (`/admin/catalog`) | CRUD Chuyên khoa, Bệnh viện, Bác sĩ, Loại khám, Khung giờ khám |
| **SCR-ADM-03** | Quản lý Lịch hẹn & No-Show (`/admin/bookings`) | Theo dõi lịch, mở khóa slot treo, xác nhận vắng mặt E12, xử lý khiếu nại |
| **SCR-ADM-04** | Bàn điều khiển Hoàn tiền (`/admin/refunds`) | Tra cứu danh sách hoàn tiền, phê duyệt/từ chối, kích hoạt giải ngân mô phỏng |
| **SCR-ADM-05** | Báo cáo Vận hành Quản trị (`/admin/reports`) | Trực quan hóa 4 báo cáo vận hành: 9 trạng thái, Doanh thu ròng, Tỷ lệ hủy, Top BS/CK |

### 4.3. Đặc tả 4 luồng màn hình tương tác chi tiết

1. **Luồng 1 (Quản lý Master Data & Slot):** Admin chọn tab danh mục tương ứng $\rightarrow$ tạo/sửa thông tin $\rightarrow$ hệ thống validate form và lưu DB. Đối với Slot: chọn bác sĩ/bệnh viện, dải giờ, thời lượng và bấm "Sinh ca khám hàng loạt".
2. **Luồng 2 (Điều phối Lịch hẹn & No-Show E12):** Admin truy cập bảng lịch hẹn $\rightarrow$ tab "Đủ điều kiện ghi vắng" $\rightarrow$ kiểm tra mốc quá 15p/120p $\rightarrow$ bấm "Xác nhận ghi vắng (T11)" $\rightarrow$ booking chuyển `no_show`, vé chuyển `expired`, không hoàn tiền. Nếu bệnh nhân khiếu nại $\rightarrow$ bấm "Xử lý khiếu nại" $\rightarrow$ chấp thuận và sinh lệnh hoàn tiền.
3. **Luồng 3 (Bàn điều khiển Hoàn tiền - Refund Console):** Admin lọc danh sách yêu cầu `requested` $\rightarrow$ kiểm tra chính sách và bấm "Duyệt hoàn tiền" $\rightarrow$ trạng thái chuyển `approved` $\rightarrow$ bấm "Giải ngân mô phỏng" $\rightarrow$ hệ thống chuyển `succeeded` và cộng dồn `payments.refunded_amount`.
4. **Luồng 4 (Báo cáo Thống kê Vận hành):** Admin chọn khoảng ngày (`from_date` đến `to_date`) $\rightarrow$ hệ thống tính toán và hiển thị trực quan: biểu đồ 9 trạng thái, thẻ chỉ số Doanh thu ròng, biểu đồ cơ cấu lý do hủy, và bảng xếp hạng Top Bác sĩ & Chuyên khoa.

---

## 5. Nhóm Báo cáo & Thống kê Phân tích (ADM_RPT)

Tuân thủ quyết định **DL-25 / CF-53**, hệ thống triển khai 4 mẫu báo cáo vận hành chính thức:

| Mã Báo Cáo | Tên Báo Cáo | Mục Đích Quản Trị | Bộ Lọc Đầu Vào | Công Thức Tính Toán |
| :---: | :--- | :--- | :--- | :--- |
| **RPT-ADM-01** | Báo cáo phân bổ 9 trạng thái lịch hẹn | Giám sát tiến độ và chu kỳ luân chuyển lịch khám trên toàn hệ thống | `from_date`, `to_date` | Tỷ lệ % trạng thái = $(\text{Số lượng theo status} / \text{Tổng lịch hẹn}) \times 100$ |
| **RPT-ADM-02** | Báo cáo Doanh thu ròng (Net Revenue) | Đánh giá hiệu quả tài chính thực thu của nền tảng y tế | `from_date`, `to_date` | **Doanh thu ròng = Tổng tiền thu thành công (received_amount) − Tổng tiền hoàn thành công (succeeded)** |
| **RPT-ADM-03** | Báo cáo Tỷ lệ hủy theo nguyên nhân | Nhận diện điểm nghẽn vận hành và lý do bệnh nhân hủy lịch | `from_date`, `to_date` | Tỷ lệ hủy chung = $(\text{Tổng hủy} / \text{Tổng lịch}) \times 100$; Tỷ lệ theo lý do = $(\text{Hủy theo mã} / \text{Tổng hủy}) \times 100$ |
| **RPT-ADM-04** | Báo cáo Top Bác sĩ & Chuyên khoa phổ biến | Phục vụ điều phối năng lực khám và vinh danh bác sĩ | `limit` (mặc định 5) | Đếm tổng số booking phát sinh nhóm theo `doctor_id` và `specialty_id` |

---

## 6. Catalog Quản trị & Sơ đồ Cấu trúc Danh mục (ADM_CAT)

Dữ liệu quản trị được thiết kế chuẩn hóa theo ERD v1.1 gồm 4 thực thể danh mục chính kết hợp với bảng giao dịch:

```text
┌──────────────────────┐          ┌──────────────────────┐
│   SPECIALTIES (14)   │ 1      n │     DOCTORS (18)     │
│ (CK01 - CK14 Chuẩn)  ├──────────┤(Biểu phí 150k - 500k)│
└──────────┬───────────┘          └──────────┬───────────┘
           │ 1                               │ 1
           │                                 │
┌──────────▼───────────┐          ┌──────────▼───────────┐
│    HOSPITALS (6)     │ 1      n │      SLOTS (7d)      │ 1      n ┌──────────────────────┐
│ (HCM & HN, GPS Lat/Lng)├────────┤ (available,full,blk) ├──────────┤     BOOKINGS (9)     │
└──────────┬───────────┘          └──────────────────────┘          │(9 trạng thái chuẩn)  │
           │ 1                                                      └──────────┬───────────┘
           ▼ n                                                                 │ 1      n
┌──────────────────────┐                                            ┌──────────▼───────────┐
│      EXAM_TYPES      │                                            │       REFUNDS        │
│(Gói khám theo CSYT)  │                                            │ (Chính sách 14 dòng) │
└──────────────────────┘                                            └──────────────────────┘
```

---

## 7. Business Rules miền Administration (ADM_BR)

| Mã Rule | Tên quy tắc nghiệp vụ | Mô tả ràng buộc hệ thống | Mức độ |
| :---: | :--- | :--- | :---: |
| **BR-ADM-01** | Bảo toàn dữ liệu Bác sĩ | Chặn xóa bác sĩ nếu đang có lịch `pending_payment`, `pending_approval` hoặc `confirmed`. | Critical |
| **BR-ADM-02** | Ràng buộc sửa / hủy Slot | Chỉ cho phép xóa hoặc đổi giờ Slot khi `booked_count == 0`. | Critical |
| **BR-ADM-03** | Khóa dòng chống Race Condition | Mọi thay đổi `booked_count` trên Slot bắt buộc chạy trong DB Transaction với `lockForUpdate()`. | Critical |
| **BR-ADM-04** | Tự động hóa trạng thái Slot | Tự động chuyển status = `full` khi `booked_count >= capacity` và `available` khi nhả chỗ. | High |
| **BR-ADM-05** | Luồng 9 trạng thái chuẩn (CF-47) | Lịch khám tuân thủ đúng 9 trạng thái: `pending_payment` $\rightarrow$ `pending_approval`/`confirmed` $\rightarrow$ `checked_in` $\rightarrow$ `completed`/`cancelled`/`expired`/`rejected`/`no_show`. Cấm chuyển lùi sai quy trình. | Critical |
| **BR-ADM-06** | Hoàn trả Slot khi Hủy Booking | Khi lịch rời `pending_payment`, `pending_approval`, `confirmed` sang hủy/hết hạn, tự động giảm `booked_count` đi 1. | High |
| **BR-ADM-07** | Phân quyền nghiêm ngặt | Chỉ tài khoản có `role = admin` được cấp quyền truy cập các API `/api/admin/*`. | Critical |
| **BR-ADM-08** | Tính duy nhất của Slot Bác sĩ | Một bác sĩ không thể có 2 ca khám trùng lặp thời gian trong cùng một ngày (`uq_slot`). | High |
| **BR-ADM-09** | Toàn vẹn tài chính Hoàn tiền | Tiền hoàn không vượt quá tiền thực thu: `refunded_amount <= received_amount` và `amount = exam_fee_refunded + service_fee_refunded`. | Critical |
| **BR-ADM-10** | Thời hạn giữ chỗ 15 phút (CF-38) | Phiếu hẹn chờ thanh toán giữ chỗ đúng **15 phút** (cộng 5 phút grace time khi giao dịch chưa rõ) trước khi job hết hạn tự giải phóng. | High |
| **BR-ADM-11** | Tiêu chí sàng lọc cơ sở y tế hợp tác (Open Access) | Admin chỉ kích hoạt (`is_active = 1`) và tích hợp các bệnh viện đạt 100% 5 tiêu chí mở (không ràng buộc mã bệnh án cũ, không giới hạn độ tuổi toàn viện, không bắt nộp giấy chuyển viện trước, nhận vé QR MedSi, biểu phí minh bạch). Tuyệt đối loại trừ bệnh viện chuyên khoa thuần biệt lập (như Bệnh viện Nhi Đồng) khỏi luồng đặt khám đại trà khi chưa có bộ lọc chuyên sâu. | Critical |

---

## 8. So sánh với đối thủ cạnh tranh (ADM_CMP)

Bảng so sánh 10 tiêu chí có dẫn chứng và nguồn kiểm chứng chính thức (Tuân thủ quyết định **DL-22 / CF-56**, loại bỏ điểm tự chấm cảm tính):

| # | Tiêu chí so sánh | MedSi (Hệ thống đề xuất) | YouMed Việt Nam | Medpro (Ứng dụng BV) | Dẫn chứng / Nguồn kiểm chứng |
| :-: | :--- | :--- | :--- | :--- | :--- |
| 1 | **Mô hình phục vụ** | Đa hình: hỗ trợ cả Bác sĩ độc lập và Bệnh viện | Tập trung phòng khám tư & BS độc lập | Tập trung bệnh viện công lập lớn | Website chính thức youmed.vn, medpro.vn |
| 2 | **Cơ chế giữ chỗ (Slot Hold)** | Giữ chỗ 15 phút, khóa dòng `lockForUpdate` | Giữ chỗ 10-15 phút trên app | Cấp số thứ tự trong ngày | [YouMed App Booking Flow, 2026] |
| 3 | **Chống đặt trùng (Race Condition)** | Khóa dòng Pessimistic Locking ở tầng DB | Queue phân luồng Redis | Phân bổ số thứ tự nối tiếp | [Medpro Help Center, 2026] |
| 4 | **Duyệt lịch bác sĩ** | Bác sĩ duyệt trong 30 phút; quá hạn hoàn tiền | Bác sĩ xác nhận qua app riêng | Bệnh viện tự động duyệt theo ca | [MedSi Baseline v1.0, DL-03] |
| 5 | **Cơ chế hoàn tiền** | 14 tình huống chuẩn hóa; Admin duyệt giải ngân | Nhân viên CSKH liên hệ xử lý thủ công | Hoàn tiền vào ví ứng dụng hoặc tài khoản | [Chính sách hoàn tiền Medpro, 2026] |
| 6 | **Xử lý vắng mặt (No-Show)** | Đánh dấu quá 15p/120p, hủy vé, Admin tiếp nhận khiếu nại | Tự động hủy sau giờ hẹn | Mất lượt khám, hủy số thứ tự | [Quy chế vận hành YouMed Clinic] |
| 7 | **Báo cáo tài chính** | Doanh thu ròng = Tổng thu − Tổng hoàn (tự động) | Báo cáo doanh thu gộp theo phòng khám | Sao kê quyết toán theo ngày | [RPT-ADM-02 / CF-53] |
| 8 | **Chế độ Demo / Sandbox** | Tích hợp sẵn Sandbox mô phỏng thanh toán & duyệt hộ | Không công khai môi trường demo | Cung cấp môi trường Test cho đối tác BV | [Mục 1 DL-03, S4-33] |
| 9 | **Tìm kiếm gần tôi (Nearby)** | Tính khoảng cách Haversine từ tọa độ GPS | Tìm kiếm theo quận/huyện | Tìm kiếm theo khu vực bệnh viện | [E18 Acceptance Criteria] |
| 10 | **Bảo vệ dữ liệu hồ sơ** | Che giấu CCCD, BHYT, SĐT khi trả về API | Ẩn số CMND/CCCD trên giao diện công cộng | Bảo mật thông tin BHYT theo chuẩn Bộ Y Tế | [Quy ước Sprint 4, DL-14] |

---

## 9. Quản trị rủi ro & Các câu hỏi mở (OQ-ADM-nn)

Danh mục 5 bài toán mở đã được chuẩn hóa và đóng theo quyết định của nhóm (**DL-21 / CF-39 / CF-54**):

* **OQ-ADM-01 (Thời gian giới hạn duyệt lịch bác sĩ):**
  * *Trạng thái:* **Đã giải quyết (Closed - CF-39 / DL-03).**
  * *Kết luận:* Bác sĩ có thời hạn duyệt là **30 phút** kể từ khi thanh toán thành công (`T02`). Nếu quá 30 phút mà bác sĩ không phản hồi, job scheduler tự động chuyển trạng thái sang `expired` (`T07`) và tạo yêu cầu hoàn 100% tiền (cả phí khám và tiện ích). Bỏ đề xuất "tự động duyệt sau 2 giờ". Admin chỉ can thiệp duyệt thay khi kích hoạt Chế độ Demo Sandbox.
* **OQ-ADM-02 (Bác sĩ nghỉ đột xuất hoặc cơ sở đóng cửa):**
  * *Trạng thái:* **Đã giải quyết (Closed - CF-31 / DL-07).**
  * *Kết luận:* Bác sĩ được phép hủy lịch khi có sự cố bất khả kháng kèm lý do bắt buộc; ca khám tương ứng bị khóa (`blocked`); hệ thống tạo yêu cầu hoàn 100% tiền (phí khám + phí tiện ích) cho bệnh nhân và gửi thông báo hỗ trợ.
* **OQ-ADM-03 (Phạm vi nghiệp vụ phân hệ Quản trị):**
  * *Trạng thái:* **Đã giải quyết (Closed - CF-54 / DL-19).**
  * *Kết luận:* Thống nhất đưa các tính năng sau ra ngoài phạm vi Sprint 4: bệnh án điện tử, đánh giá/bình luận, mã giảm giá voucher (`discount_amount = 0`), hoa hồng chiết khấu, SMS/email gateway thật, và giải ngân ngân hàng thật (dùng mô phỏng).
* **OQ-ADM-04 (Xử lý khiếu nại vắng mặt No-show):**
  * *Trạng thái:* **Đã giải quyết (Closed - CF-44 / DL-08).**
  * *Kết luận:* Sau khi Admin xác nhận vắng mặt (`T11` $\rightarrow$ `no_show`, vé `expired`, hoàn 0đ), Admin có thẩm quyền tiếp nhận khiếu nại của bệnh nhân qua API `POST /api/admin/no-shows/bookings/{id}/complaint`. Nếu bệnh nhân chứng minh được lý do chính đáng, Admin duyệt hoàn 100% phí khám.
* **OQ-ADM-05 (Phân quyền quản trị và an toàn kiểm toán):**
  * *Trạng thái:* **Đã giải quyết (Closed - CF-46 / DL-02).**
  * *Kết luận:* Duy trì 4 role chuẩn: `patient`, `doctor`, `staff` (gắn `hospital_id`), `admin`. Mọi tác động nhạy cảm của Admin (ghi vắng, duyệt hoàn tiền, ghi đè demo) bắt buộc phải ghi nhật ký kiểm toán bất biến vào bảng `audit_logs` (AU-11, AU-16, AU-17).

---

## 10. Nguồn tham khảo (References)

1. **Danh mục hành chính & Địa lý:**
   * Tổng cục Thống kê (GSO) — *Danh mục 63 tỉnh, thành phố trực thuộc Trung ương của Việt Nam* (Quyết định số 124/2004/QĐ-TTg và các cập nhật hành chính hiện hành) (https://www.gso.gov.vn).
2. **Khảo sát đối thủ cạnh tranh:**
   * Nền tảng y tế số YouMed Việt Nam — Phân hệ YouMed Clinic Workspace (https://youmed.vn).
   * Ứng dụng đặt lịch khám bệnh Medpro — Quy trình phát số và điều phối cơ sở y tế (https://medpro.vn).
   * Nền tảng đặt khám chuyên khoa BookingCare — Quy trình điều phối lịch hẹn (https://bookingcare.vn).
3. **Tiêu chuẩn kỹ thuật & Kiến trúc:**
   * Laravel 12 Framework Documentation — *Database Transactions, Pessimistic Locking & State Machine Patterns* (https://laravel.com/docs/12.x).
   * MySQL 8.0 Reference Manual — *InnoDB Locking and Transaction Model, CHECK Constraints* (https://dev.mysql.com/doc/refman/8.0/en/).
4. **Văn bản nội bộ dự án MedSi:**
   * [MedSi_Tai_lieu_thong_nhat_v0.1.md](file:///d:/Project/IS207/docs/MedSi_Tai_lieu_thong_nhat_v0.1.md) — Tài liệu thống nhất v1.0 (Baseline chuẩn cho Sprint 4).
   * [medsi_schema_v1.sql](file:///d:/Project/IS207/docs/medsi_schema_v1.sql) — Lược đồ cơ sở dữ liệu quan hệ MedSi v1.1 (14 bảng).
   * [SPR4-requirement.md](file:///d:/Project/IS207/docs/SPR4-requirement.md) — Kế hoạch kiểm thử chấp nhận E01 – E18 Sprint 4.
