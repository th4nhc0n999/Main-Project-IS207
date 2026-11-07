# THÔNG BÁO QUY ĐỊNH & PHỐI HỢP NỘI BỘ: TIÊU CHÍ SÀNG LỌC BỆNH VIỆN HỢP TÁC TRÊN HỆ THỐNG MEDSI

> **Người ban hành:** Vũ Trọng Tuấn Anh (Domain Owner: Hospital Booking & Tickets — BKH/TKT)  
> **Người nhận phối hợp:**  
> • Nguyễn Thành Công (Project Lead / Admin Catalog & Platform)  
> • Trần Hoài An (Database Architect / State Machine & Seeders)  
> • Đỗ Trọng Hiệu (Doctor Appointment & Profile)  
> • Đoàn Quốc Khôi (Payment & Invoicing)  
> **Ngày ban hành:** 07/11/2026  
> **Trạng thái:** **CHÍNH THỨC — ĐÃ THỐNG NHẤT TRONG NHÓM (TEAM CONSENSUS)**  
> **Tài liệu liên quan:** `docs/SPR4-requirement.md`, `docs/BKH_DD.md`, `docs/MedSi_Tai_lieu_thong_nhat_v0.1.md`

---

## 1. BỐI CẢNH & NGUYÊN NHÂN ĐƯA RA QUY ĐỊNH

Trong quá trình khảo sát thực tế các cơ sở y tế tại Việt Nam, nhóm nhận thấy một số bệnh viện áp dụng các **điều kiện tiên quyết (prerequisites/constraints)** rất ngặt nghèo khi người bệnh đăng ký khám:
1. **Ràng buộc hồ sơ bệnh án cũ:** Bắt buộc người bệnh phải từng khám tại viện trước đó và cung cấp mã bệnh nhân/mã bệnh án (chỉ cho phép đăng ký tái khám trực tuyến, không nhận bệnh nhân mới).
2. **Ràng buộc đối tượng/độ tuổi:** Một số bệnh viện chuyên khoa đặc thù chỉ nhận nhóm độ tuổi nhất định (ví dụ: Bệnh viện Nhi chỉ nhận dưới 16 tuổi; bệnh viện lão khoa).
3. **Ràng buộc hành chính phức tạp:** Bắt buộc có giấy chuyển tuyến BHYT hợp lệ ngay tại bước đặt chỗ trước khi được cấp số thứ tự.

### Rủi ro nghiệp vụ đối với MedSi:
* Hệ thống MedSi (phiên bản Sprint 4 / MVP) hiện tại chưa kết nối cơ sở dữ liệu bệnh án quốc gia để đối soát lịch sử khám ngoại viện.
* Nếu đưa các bệnh viện có điều kiện ràng buộc này vào nền tảng mà không có cơ chế hậu kiểm tự động, bệnh nhân vẫn đăng ký và thanh toán thành công, nhưng khi đến quầy tiếp đón quét mã QR sẽ **bị từ chối tiếp nhận (rejected tại quầy)**.
* Hậu quả: Gây xung đột nghiêm trọng với người bệnh, phát sinh tranh chấp hoàn tiền viện phí, làm sai lệch báo cáo giữ chỗ và phá vỡ luồng State Machine tự động (`T02H` $\rightarrow$ `T09`).

---

## 2. QUYẾT ĐỊNH CỦA NHÓM (TEAM DECISION)

> 🎯 **QUY TẮC CỐT LÕI:**  
> **Nền tảng MedSi giai đoạn hiện tại CHỈ LỌC CHỌN VÀ TÍCH HỢP những bệnh viện KHÔNG CÓ BẤT KỲ ĐIỀU KIỆN RÀNG BUỘC THÊM NÀO khi đăng ký khám.**

Mọi bệnh viện hiển thị trên hệ thống MedSi phải đảm bảo tính chất **Mở & Dễ tiếp cận (Open Access)**: Bất kỳ người bệnh nào có tài khoản hợp lệ đều có thể chọn ca khám, giữ chỗ 15 phút, thanh toán và chắc chắn được tiếp nhận khám đúng số thứ tự khi đến quét QR.

---

## 3. BẢNG TIÊU CHÍ SÀNG LỌC BỆNH VIỆN (CRITERIA MATRIX)

| STT | Tiêu chí đánh giá | ✅ TIÊU CHÍ ĐƯỢC CHẤP THUẬN (Eligible) | ❌ TIÊU CHÍ BỊ LOẠI TRỪ (Disqualified) |
| :---: | :--- | :--- | :--- |
| **1** | **Lịch sử khám bệnh** | Nhận cả **Bệnh nhân khám lần đầu** lẫn tái khám; không yêu cầu nhập mã hồ sơ y tế cũ. | Chỉ cho phép tái khám; bắt buộc phải có mã số bệnh nhân lưu sẵn tại viện. |
| **2** | **Giới hạn độ tuổi** | Tiếp nhận đa dạng đối tượng, hoặc việc phân loại độ tuổi chỉ theo chuyên khoa thông thường (Khoa Nội, Khoa Ngoại...). | Toàn bộ cơ sở chỉ khám cho một nhóm tuổi đặc thù (ví dụ chỉ dành riêng cho trẻ em) mà luồng chung chưa chặn được. |
| **3** | **Giấy tờ chuyển viện** | Không bắt buộc nộp giấy chuyển viện hay xác nhận BHYT trước khi phát hành phiếu khám. | Bắt buộc phải có giấy chuyển viện trước mới cho đặt lịch. |
| **4** | **Quy trình tiếp nhận** | Đồng thuận tiếp nhận bệnh nhân thông qua **Mã phiếu khám (`ticket_code`) và Mã QR chuẩn MedSi**. | Từ chối tiếp nhận qua mã QR MedSi, bắt buộc lấy số lại từ đầu ở cây bốc số thủ công. |
| **5** | **Biểu phí dịch vụ** | Biểu phí khám chuyên khoa cố định, minh bạch, đồng ý cộng thêm phí tiện ích nền tảng 20.000 VNĐ. | Biểu phí thả nổi, tính phí phát sinh không báo trước gây khó khăn khi chốt thanh toán `T02H`. |

---

## 4. PHÂN CÔNG PHỐI HỢP GIỮA CÁC THÀNH VIÊN

Để thực hiện đồng bộ quy định trên từ tầng Database, Backend, Frontend đến Dữ liệu Seed mẫu, các thành viên thống nhất phân công như sau:

### 1. Bạn Nguyễn Thành Công (Project Lead & Admin Catalog)
* **Quản trị Catalog (`AdminCatalogPage.jsx`):** Khi duyệt hoặc nhập liệu các đối tác bệnh viện mới vào hệ thống, chỉ kích hoạt (`is_active = 1`) những bệnh viện đạt 100% tiêu chí ở Bảng 3.
* **Mô tả bệnh viện:** Ghi rõ thông tin tiếp đón tại phần mô tả bệnh viện: *"Tiếp nhận khám bệnh nhân mới và tái khám qua phiếu khám điện tử MedSi"*.

### 2. Bạn Trần Hoài An (Database Architect & Seeders)
* **Rà soát dữ liệu Seed mẫu (`DatabaseSeeder.php` / `HospitalSeeder`):**
  * Kiểm tra lại toàn bộ danh sách bệnh viện mẫu đang seed trong cơ sở dữ liệu (`hospitals` table).
  * Đảm bảo các bệnh viện được đưa vào làm mẫu (ví dụ: Bệnh viện Đại học Y Dược TP.HCM, Bệnh viện Chợ Rẫy, Bệnh viện Nhân dân Gia Định...) đều là bệnh viện đa khoa, nhận khám đại trà cho mọi bệnh nhân.
  * Tuyệt đối không seed dữ liệu các bệnh viện đặc thù (như Bệnh viện Nhi Đồng) vào danh mục đặt khám viện đại trà khi chưa có bộ lọc ngày sinh/độ tuổi riêng.

### 3. Bạn Vũ Trọng Tuấn Anh (Domain Owner: Hospital Booking & Tickets)
* **Luồng đặt khám (`HospitalBookingPage.jsx` & `HospitalBookingController.php`):**
  * Đảm bảo luồng đặt lịch viện diễn ra thông suốt: Chọn Viện $\rightarrow$ Chọn Khoa $\rightarrow$ Chọn Ca còn chỗ $\rightarrow$ Giữ chỗ 15 phút $\rightarrow$ Xác nhận thanh toán $\rightarrow$ Cấp vé QR & STT nguyên tử.
  * Cập nhật các câu hỏi phỏng vấn người dùng thực tế tại Mục 10 trong `docs/BKH_DD.md` tập trung vào trải nghiệm đặt khám thuận tiện, không gặp rào cản về thủ tục hành chính.

### 4. Bạn Đoàn Quốc Khôi (Payment) & Bạn Đỗ Trọng Hiệu (Doctor Flow)
* **Khôi (Payment):** Đảm bảo hóa đơn thanh toán cho bệnh viện luôn áp dụng mức phí cố định chuẩn, không phát sinh phụ thu bất thường.
* **Hiệu (Doctor):** Lưu ý luồng đặt khám Bác sĩ riêng (`DOC`) có thể có yêu cầu chuyên sâu theo từng bác sĩ, nhưng luồng Đặt khám Bệnh viện (`BKH`) của Tuấn Anh phải giữ vững nguyên tắc mở, không ràng buộc.

---

## 5. BẢNG CHECKLIST KIỂM DUYỆT BỆNH VIỆN MỚI TRƯỚC KHI ONBOARD

Mỗi khi nhóm quyết định bổ sung thêm một bệnh viện vào hệ thống MedSi, người thực hiện phải đánh dấu tích đủ 5 điều kiện sau:

- [ ] 1. Bệnh viện đồng ý tiếp nhận bệnh nhân khám lần đầu (không yêu cầu mã bệnh án cũ).
- [ ] 2. Không giới hạn độ tuổi khắt khe trên toàn viện.
- [ ] 3. Không yêu cầu nộp giấy chuyển viện trước mới cấp ca khám.
- [ ] 4. Quầy tiếp đón sẵn sàng quét mã QR MedSi tại endpoint `/check-in`.
- [ ] 5. Giá khám theo chuyên khoa rõ ràng, hỗ trợ thanh toán trực tuyến và hoàn tiền nếu có sự cố.

---

*Văn bản này được lưu trữ chính thức tại kho lưu trữ dự án: `docs/THONG_BAO_TIEU_CHI_CHON_BENH_VIEN.md` để làm căn cứ đối chiếu nghiệm thu dự án và bảo vệ trước hội đồng đánh giá môn học IS207.*

