# Hướng dẫn Sử dụng Hệ thống Trợ lý Điều tra & Đối chiếu Luật Hình sự

Tài liệu này hướng dẫn chi tiết cách thức vận hành và sử dụng các tính năng nghiệp vụ của giao diện Single Page Application (SPA) trong Hệ thống Trợ lý Điều tra.

---

## 1. Đăng nhập Hệ thống

1. Mở trình duyệt và truy cập vào địa chỉ hệ thống (Mặc định: `http://localhost:8000/` hoặc IP mạng LAN cơ quan).
2. Nhập thông tin tài khoản được cấp:
   - **Tài khoản mặc định thử nghiệm:**
     - Điều tra viên: `dtv` / mật khẩu: `dtv`
     - Lãnh đạo: `leader` / mật khẩu: `leader` (hoặc tạo tài khoản Lãnh đạo từ tài khoản `admin`)
     - Quản trị viên: `admin` / mật khẩu: `admin`
3. Nhấp nút **"Đăng nhập hệ thống"**. Token bảo mật (JWT) sẽ tự động lưu vào phiên làm việc.

---

## 2. Giao diện Nghiệp vụ Chính

Sau khi đăng nhập thành công, giao diện sẽ xuất hiện thanh điều hướng bên trái (Sidebar) gồm 5 tab nghiệp vụ cốt lõi:

### 2.1. Bảng điều khiển (Dashboard)
- Xem nhanh các thông số tổng quan: Tổng số án thụ lý, số án đang tiến hành, số án tạm đình chỉ, án đã khép hồ sơ và tổng giá trị thiệt hại tài sản quy đổi.
- Theo dõi danh sách 10 hoạt động nghiệp vụ gần nhất của hệ thống (Nhật ký nhanh).

### 2.2. Quản lý Hồ sơ Vụ án (Cases)
- **Danh sách vụ án:** Hiển thị toàn bộ các vụ án đang thụ lý.
- **Thụ lý vụ án mới (Chỉ dành cho Điều tra viên):** 
  - Nhấp nút **"Thụ lý vụ án mới"**.
  - Nhập mã quyết định thụ lý, tên vụ việc, ngày xảy ra, địa bàn và tóm tắt diễn biến sơ bộ.
- **Xem chi tiết vụ án:** Nhấp vào bất kỳ vụ án nào trong danh sách để mở trang chi tiết.
- **Cập nhật thông tin vụ án:** Tại trang chi tiết, nhấp **"Cập nhật thông tin"** để chỉnh sửa hành vi hoặc giá trị thiệt hại tài sản (Hệ thống tự động định dạng VNĐ khi gõ).
- **Thêm/sửa đối tượng liên quan:**
  - Nhấp **"Thêm bị can / đối tượng"**.
  - Nhập họ tên, ngày sinh (định dạng `DD/MM/YYYY` bắt buộc), số CCCD (đúng 9 hoặc 12 số) và vai trò (`Bị can`, `Bị hại`, `Nhân chứng`).
  - Nếu là Bị can, chọn vị thế đồng phạm (`Chủ mưu`, `Thực hành`, `Giúp sức`, `Xúi giục`).

### 2.3. Tra cứu Bộ luật Hình sự (Laws Lookup)
- **Cột trái (Cây thư mục):** Phân chia Bộ luật Hình sự thành cấu trúc cây phân cấp: Chương -> Danh sách Điều luật.
- **Cột phải (Khung tìm kiếm nâng cao):**
  - Tìm kiếm toàn văn bằng cách nhập từ khóa hành vi (Ví dụ: `trộm cắp`, `buôn lậu`, `hối lộ`) hoặc số Điều (Ví dụ: `Điều 173`).
  - Hệ thống tự động highlight (bôi màu) các từ khóa trùng khớp trong văn bản luật.
  - Tách nội dung điều luật theo từng **Khoản** kèm các Badge chỉ thị mức độ hình phạt.
  - Sử dụng nút **"Sao chép"** để copy căn cứ pháp lý vào Clipboard.
  - Sử dụng nút **"Ghim án"** để gắn điều luật đó làm căn cứ cho vụ án đang mở.

### 2.4.workbench So sánh Đối chiếu (Legal Match)
- Chọn vụ án thụ lý từ danh sách để khởi chạy động cơ phân tích.
- **Lọc đối tượng:** Chọn bị can cần đối chiếu tại Dropdown phía trên cột trái.
- **Phân tích độ tuổi chịu TNHS (Điều 12):** Card màu tự động hiển thị mức độ trách nhiệm hình sự của bị can tại thời điểm gây án (Xanh: Đủ tuổi; Vàng: Chịu TNHS giới hạn 14-16t; Đỏ: Dưới 14t được miễn trách nhiệm).
- **Phân tích tái phạm (Điều 53):** Cảnh báo nếu đối tượng có tiền án tiền sự chưa được xóa án tích.
- **Đề xuất định khung:** Hiển thị các Điều luật đề đề xuất, xác định Khoản định khung tối ưu dựa trên thiệt hại tài sản thực tế và đánh giá năng lực TNHS đối với tội danh đó.

### 2.5. Xuất Phiếu nghiệp vụ (Report Export)
- Tại màn hình đối chiếu, nhấp **"In Phiếu Đề Xuất Định Tội"**.
- Hệ thống tự động gọi trình in ấn (`window.print()`). Bạn có thể xuất trực tiếp ra máy in mạng LAN hoặc lưu thành tệp **PDF** chất lượng cao.
- Phiếu đề xuất được định dạng sẵn tiêu đề tiêu ngữ hành chính và các phần ký tên xác nhận của điều tra viên thụ lý cùng Lãnh đạo Cơ quan Điều tra.

### 2.6. Nhật ký kiểm toán & Phân quyền (Audit Logs / User Admin)
- **Nhật ký kiểm toán (Lãnh đạo / Admin):** Truy cập xem mọi hoạt động truy cập thông tin nhạy cảm trên hệ thống (Thời gian, Tên cán bộ thao tác, Hành động thực hiện, Mã hồ sơ vụ án).
- **Quản lý tài khoản (Admin):** Đăng ký tài khoản cho cán bộ điều tra mới và phân quyền RBAC tương ứng.

### 2.7. Tối ưu hóa Không gian làm việc (Collapsible Sidebar) & Định dạng ngày
- **Thu gọn/Mở rộng Sidebar:** Nhấp nút mũi tên tròn ở biên phải của thanh Sidebar để thu gọn thành dạng biểu tượng (Icon-only), mở rộng tối đa vùng làm việc trung tâm cho các tác vụ như đối chiếu luật hay soạn thảo văn bản. Di chuột vào biểu tượng để xem tooltip tên tab nghiệp vụ.
- **Đồng bộ hóa ngày tháng `dd/mm/yyyy`:** Toàn bộ hệ thống ngày tháng năm hiển thị (ngày xảy ra, ngày sinh bị can, ngày tạo tài khoản, nhật ký kiểm toán) đều được hiển thị theo quy chuẩn tiếng Việt `dd/mm/yyyy` thay vì `yyyy-mm-dd`.

---

## 3. Các Tính năng An ninh Bảo mật Cục bộ

1. **Che mờ CCCD / Thông tin nhân thân (Masking):** Mặc định số CCCD và Họ tên trong danh sách sẽ bị che mờ để chống chụp trộm màn hình. Nhấp vào nút biểu tượng "Mắt che" để xem thông tin gốc. Mọi thao tác mở ẩn này đều bị hệ thống ghi nhận vào Audit Log nghiệp vụ.
2. **Tự động Khóa màn hình (Auto Logout):** Nếu không phát hiện bất kỳ tương tác chuột hay bàn phím nào trên màn hình trong vòng 15 phút, hệ thống sẽ hiển thị đồng hồ đếm ngược 60 giây và tự động khóa màn hình/đăng xuất để tránh lộ dữ liệu khi cán bộ rời vị trí làm việc.
3. **Watermark Đóng dấu Mật:** Một lớp Watermark chéo mờ hiển thị `"MẬT - [Họ tên Điều tra viên] - [IP LAN] - [Thời gian thực]"` chạy đè toàn bộ trang nhằm ngăn ngừa việc chụp ảnh màn hình tuồn thông tin ra ngoài.
