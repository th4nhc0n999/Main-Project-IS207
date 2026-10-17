# THƯ MỤC ẢNH CHỤP MÀN HÌNH TÍNH NĂNG ĐỊNH VỊ BÁC SĨ GẦN TÔI (UI_NEAR)

Thư mục này lưu trữ ảnh chụp màn hình thực tế (Live App Screenshots) của tính năng **Near-me (Định vị bác sĩ & cơ sở y tế theo GPS)** trên giao diện web MedSi, phục vụ nghiệm thu phân hệ UI & UX (Sprint 3).

---

## 📸 Danh Sách Các Ảnh Chụp Màn Hình Cần Bổ Sung (Khuyến Nghị):

| Tên File Ảnh | Tên Màn Hình / Kịch Bản Kiểm Thử | Mô Tả Trạng Thái Giao Diện | Đường Dẫn Test Trực Tiếp |
| :--- | :--- | :--- | :--- |
| **`UI_NEAR_01.png`** | Bảng điều khiển GPS & Cho phép quyền (Granted) | Nhấn "Lấy GPS tự động" hoặc mở URL có param `?near=true`. Hiển thị badge cự ly `Cách bạn X.X km • ~Y phút đi xe` trên từng thẻ bác sĩ. | `http://localhost:5173/doctors?near=true` |
| **`UI_NEAR_02.png`** | Chọn bán kính lọc (`< 2 km`, `< 5 km`, `< 10 km`) | Nhấn chọn chip bán kính lọc `< 5 km` (mặc định) hoặc `< 2 km`. Danh sách tự động lọc và sắp xếp tăng dần theo khoảng cách gần nhất. | `http://localhost:5173/doctors?near=true&radius=5` |
| **`UI_NEAR_03.png`** | Fallback thủ công chọn Quận/Huyện (`EX-UI-01`) | Hộp thoại Modal xuất hiện khi quyền GPS bị chặn hoặc khi bấm nút "Chọn Quận/Huyện" (VD: chọn Quận 1, Quận 5 hoặc Quận 10). | Mở Modal "Chọn Khu Vực Của Bạn" |
| **`UI_NEAR_04.png`** | Trạng thái không có cơ sở trong bán kính (`EX-UI-02`) | Chọn bán kính hẹp `< 2 km` tại khu vực chưa có phòng khám. Hiển thị card cảnh báo thân thiện và gợi ý nút "Mở rộng lên 10 km / 20 km". | Chọn bán kính hẹp không có kết quả |
| **`UI_NEAR_05.png`** | Chi tiết bác sĩ kèm tọa độ GPS & Chỉ đường | Trang chi tiết bác sĩ hiển thị trạng thái "Đã xác thực tọa độ GPS" và nút "Chỉ đường" liên kết Google Maps. | `http://localhost:5173/doctors/1` |

---

## 🧮 Cơ Sở Kỹ Thuật (Specification References):
- **PlantUML Activity Diagram:** [ACT-UI-01.png](../UI_ACT/ACT-UI-01.png)
- **Công thức tính:** Haversine Spherical Distance $R = 6371\text{ km}$, làm tròn 1 chữ số thập phân (`X.X km`)
- **Quy tắc nghiệp vụ:** `BR-UI-08` (Bán kính 2/5/10/20 km), `BR-UI-09` (Định dạng hiển thị), `BR-UI-10` (Sắp xếp tăng dần theo cự ly), `BR-UI-23` (Độ trễ phản hồi < 1.5s).
