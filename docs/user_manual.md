# Hướng dẫn Sử dụng Hệ thống Trợ lý Điều tra & Đối chiếu Luật Hình sự (PPU Investigation Assistant)

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

Sau khi đăng nhập thành công, giao diện xuất hiện thanh điều hướng bên trái (Sidebar) gồm các tab nghiệp vụ cốt lõi:

### 2.1. Bảng điều khiển (Dashboard)
- Xem nhanh các thông số tổng quan: Tổng số án thụ lý, số án đang tiến hành, số án tạm đình chỉ, án đã khép hồ sơ và tổng giá trị thiệt hại tài sản quy đổi.
- Theo dõi danh sách 10 hoạt động nghiệp vụ gần nhất của hệ thống (Nhật ký nhanh).

### 2.2. Quản lý Hồ sơ Vụ án (Cases & Suspects)
- **Danh sách vụ án:** Hiển thị toàn bộ các vụ án đang thụ lý trong cơ sở dữ liệu.
- **Thụ lý vụ án mới:** 
  - Nhấp nút **"Thụ lý vụ án mới"**.
  - Nhập mã quyết định thụ lý (`QĐ-01/2026/VPCQ`), tên vụ việc, ngày xảy ra, địa bàn và tóm tắt diễn biến sơ bộ.
- **Thêm/sửa đối tượng liên quan:**
  - Nhấp **"Thêm bị can / đối tượng"**.
  - Nhập họ tên, ngày sinh (`DD/MM/YYYY`), số CCCD (tự động che mờ `035***891`) và vai trò (`Bị can`, `Bị hại`, `Nhân chứng`).
  - Nếu là Bị can, chọn vị thế đồng phạm (`Chủ mưu`, `Thực hành`, `Giúp sức`, `Xúi giục`).

### 2.3. Workbench Định Tội Danh & Kết nối Hồ sơ Thực tế
- **Chọn Hồ sơ Vụ án thụ lý / Mô phỏng:** Chọn vụ án đang thụ lý từ dropdown. Hệ thống tự động nạp diễn biến hành vi, bị can, hung khí và thiệt hại tài sản thực tế.
- **Lọc Đối tượng Đồng phạm (Multi-Suspect Selector):**
  - Chuyển tab đối tượng: `[Bị can 1: Nguyễn Văn A]`, `[Bị can 2: Trần Văn B]`.
  - Hệ thống cập nhật tuổi bị can, năng lực TNHS (Điều 12 BLHS) và tiền án tiền sự (Điều 52, 53 BLHS) riêng cho **chính bị can đó**.
- **Cảnh báo Năng lực TNHS theo độ tuổi (Điều 12):**
  - 🔴 *Dưới 14 tuổi:* Thẻ đỏ cảnh báo loại trừ TNHS.
  - 🟠 *Từ 14 đến dưới 16 tuổi:* Thẻ cam cảnh báo TNHS giới hạn.
  - 🟢 *16 tuổi trở lên:* Thẻ xanh đủ năng lực TNHS.
- **Biểu đồ Chart.js So sánh Điểm S(f, Ck):** Trực quan hóa điểm so khớp 4 yếu tố cấu thành tội phạm giữa các điều luật gợi ý.
- **Khối Graph Distillation & XAI Operator:** Phân định rõ ràng các tội danh giáp ranh (*Cướp vs Cướp giật*, *Giết người chưa đạt vs Cố ý gây thương tích*) và trích xuất luồng suy luận 5 bước (`XAI Reasoning Path`).

### 2.4. Phân hệ Ma trận Mâu thuẫn Lời khai & Chứng cứ (Evidence Contradiction Matrix)
- Rà soát các điểm bất đồng lời khai giữa các bị can đồng phạm được tự động phát hiện:
  - 🔴 *Xung đột vai trò đồng phạm (Chủ mưu vs Giúp sức)*
  - 🟡 *Bất đồng nguồn gốc hung khí gây án*
  - 🔵 *Mâu thuẫn mốc thời gian ngoại phạm (Lời khai vs Camera/BTS)*
- Đọc khuyến nghị nghiệp vụ từ hệ thống (Ví dụ: *Yêu cầu đối chất theo Điều 189 BLTTHS*).

### 2.5. Phân hệ Sơ đồ Mối quan hệ Đồ thị (CaseGraphVisualizer)
- Hiển thị trực quan sơ đồ 2D/3D biểu diễn mối quan hệ giữa Bị can, Bị hại, Hung khí, Thiệt hại và Điều luật.
- Nhấp nút **"Luồng XAI Path"** trên góc phải sơ đồ để bật/tắt Overlay hiển thị luồng suy luận 5 bước của AI.

### 2.6. Xuất Phiếu Đề xuất Định tội danh (Report Print Engine)
- Tại Workbench, nhấp nút **"In Báo Cáo"** (hoặc phím `Ctrl + P`).
- Hệ thống xuất định dạng **Phiếu Đề Xuất Định Tội Danh Sơ Bộ** chuẩn mẫu tố tụng gồm thông tin vụ án, bị can, điều luật đề xuất, điểm so khớp và phần ký tên xác nhận của Điều tra viên cùng Lãnh đạo.

---

## 3. Các Tính năng An ninh Bảo mật Cục bộ

1. **Che mờ CCCD / Thông tin nhân thân (Masking):** Mặc định số CCCD sẽ bị che mờ (`035***891`). Nhấp nút "Mắt che" để xem thông tin gốc. Mọi thao tác này bị hệ thống lưu vết vào Audit Log.
2. **Tự động Khóa màn hình (Auto Logout):** Tự động khóa màn hình sau 15 phút không tương tác.
3. **Security Watermark Đóng dấu Mật:** Lớp Watermark mờ hiển thị `"MẬT - [Họ tên] - [IP LAN] - [Thời gian thực]"` chạy đè toàn bộ trang nhằm chống chụp ảnh màn hình.
