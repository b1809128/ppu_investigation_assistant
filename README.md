# HỆ THỐNG TRỢ LÝ ĐIỀU TRA & ĐỐI CHIẾU LUẬT HÌNH SỰ (INVESTIGATION ASSISTANT)

Hệ thống nghiệp vụ phục vụ Điều tra viên và Lãnh đạo cơ quan điều tra hoạt động hoàn toàn cục bộ, an toàn thông tin (LAN Offline/Air-gapped). Hệ thống cung cấp các chức năng quản lý hồ sơ vụ án, đối tượng liên quan (bị can, người làm chứng, bị hại) đi kèm công cụ đối chiếu hành vi thực tế sang các điều luật trong Bộ luật Hình sự Việt Nam 2015.

---

## 1. Các Tính năng Chính

*   **Xác thực & Phân quyền RBAC (Role-Based Access Control)**:
    *   `ADMIN`: Quản lý tài khoản người dùng hệ thống.
    *   `LEADERSHIP`: Xem toàn bộ hồ sơ vụ án, xem Nhật ký kiểm toán (`audit_logs`), phê duyệt hoặc xóa vụ án.
    *   `INVESTIGATOR` (Điều tra viên): Tạo hồ sơ vụ án mới, thêm/sửa thông tin đối tượng liên quan thuộc vụ án mình thụ lý. Bị hạn chế quyền xóa vụ án và không được xem Nhật ký kiểm toán.
*   **Quản lý Hồ sơ Vụ án (`case_files`)**:
    *   CRUD thông tin vụ án (Số quyết định thụ lý, tên vụ án, tóm tắt nội dung, trạng thái điều tra).
    *   Quản lý danh sách đối tượng trong vụ án (Họ tên, ngày sinh, số CMND/CCCD, địa chỉ, vai trò trong vụ án).
*   **Đối chiếu Luật Hình sự (Legal Engine)**:
    *   Tra cứu nhanh nội dung điều luật từ cơ sở dữ liệu `bo_luat_hinh_su_2015.json` được nạp sẵn vào bộ nhớ (In-memory cache).
    *   Nhập mô tả hành vi của nghi phạm để đối chiếu tự động, tính điểm (%) trùng khớp từ khóa và gợi ý các tội danh tương ứng từ Bộ luật Hình sự.
*   **Nhật ký Kiểm toán bắt buộc (Audit Logs)**:
    *   Tự động ghi nhận mọi hoạt động xem thông tin, truy vấn danh sách, chỉnh sửa hoặc xóa hồ sơ vụ án trước khi dữ liệu được trả về cho người dùng.

---

## 2. Yêu cầu Hệ thống & Cài đặt

### Yêu cầu
*   **Python**: Phiên bản 3.9 trở lên (Đã thử nghiệm tốt trên 3.14).
*   **Cơ sở dữ liệu**: MySQL 8.0 trở lên (Mặc định tương thích cổng 3306 của XAMPP).

### Cài đặt nhanh

1.  **Tạo môi trường ảo & Cài đặt thư viện**:
    ```bash
    # Tạo venv
    python3 -m venv venv
    
    # Kích hoạt venv
    source venv/bin/activate
    
    # Cài đặt các thư viện cần thiết
    pip install fastapi uvicorn sqlalchemy pymysql cryptography pyjwt bcrypt pydantic-settings python-multipart httpx
    ```

2.  **Cấu hình Cơ sở dữ liệu**:
    *   Khởi động MySQL trên XAMPP hoặc MySQL Server cục bộ.
    *   Mặc định hệ thống kết nối qua: `mysql+pymysql://root:@localhost:3306/investigation_assistant?charset=utf8mb4`
    *   Hệ thống sẽ **tự động tạo database tables** và cấu trúc bảng khi chạy lần đầu tiên.

---

## 3. Cách Vận hành Hệ thống

### Cách 1: Khởi chạy Đồng thời cả Backend và Frontend (Dev Mode)
Chạy script Python tự động quản lý vòng đời tiến trình ở thư mục gốc:
```bash
./run_app.py
```
*Script này sẽ chạy đồng thời uvicorn server ở cổng 8000 và vite server ở cổng 5173, đồng thời tự động dừng sạch sẽ cả 2 server khi bấm `Ctrl + C`.*

### Cách 2: Khởi chạy Backend Server (FastAPI) thủ công
Kích hoạt môi trường ảo và chạy lệnh:
```bash
venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

*   **Trang chủ kiểm tra kết nối**: `http://localhost:8000/`
*   **Tài liệu hướng dẫn API tương tác (Swagger UI)**: `http://localhost:8000/docs`
*   **Tài liệu ReDoc**: `http://localhost:8000/redoc`

### Tài khoản Mặc định được Nạp sẵn (Startup Seeds)

Khi khởi động ứng dụng lần đầu, hệ thống sẽ tự động đăng ký 2 tài khoản thử nghiệm:
1.  **Quản trị viên (ADMIN)**:
    *   Tên tài khoản (username): `admin`
    *   Mật khẩu (password): `admin`
2.  **Điều tra viên (INVESTIGATOR)**:
    *   Tên tài khoản (username): `dtv`
    *   Mật khẩu (password): `dtv`

---

## 4. Hướng dẫn Sử dụng Nghiệp vụ qua API

### Bước 1: Đăng nhập nhận Token JWT
*   Truy cập endpoint: `POST /api/auth/login`
*   Gửi thông tin dưới dạng Form Data: `username` và `password`.
*   Hệ thống phản hồi chuỗi `access_token`. Đính kèm mã này vào Header của mọi request tiếp theo dưới dạng:
    `Authorization: Bearer <access_token>`

### Bước 2: Quản lý Vụ án (Dành cho Điều tra viên / Lãnh đạo)
*   **Tạo vụ án mới**: `POST /api/cases`
    *   Body mẫu:
        ```json
        {
          "case_number": "QĐ-01/2026/VPCQ",
          "title": "Vụ án trộm cắp tài sản tại tiệm vàng Kim Phát",
          "description": "Đối tượng cạy cửa đột nhập lấy trộm 20 cây vàng trong đêm."
        }
        ```
*   **Thêm nghi phạm/bị hại**: `POST /api/cases/{case_id}/suspects`
    *   Body mẫu:
        ```json
        {
          "full_name": "Nguyễn Văn Hùng",
          "date_of_birth": "1995-08-12",
          "identity_card": "079095012345",
          "address": "123 Nguyễn Huệ, Quận 1",
          "role_in_case": "SUSPECT"
        }
        ```

### Bước 3: Tra cứu & Đối chiếu Luật Hình sự
*   **Tra cứu Luật**: `GET /api/legal/search?query=trộm cắp` hoặc tìm chính xác điều luật `GET /api/legal/search?dieu=173`.
*   **Chẩn đoán hành vi pháp lý**: `POST /api/legal/match`
    *   Gửi đoạn mô tả lời khai hoặc hành vi thực tế của đối tượng:
        ```json
        {
          "behavior_description": "Nghi phạm đột nhập từ cửa sau, dùng kìm cộng lực cắt khóa rồi trộm xe máy của chủ nhà."
        }
        ```
    *   Hệ thống sẽ trả về danh sách các điều luật phù hợp kèm các từ khóa khớp trực tiếp (ví dụ: `trộm cắp`, `cạy cửa`, `lấy trộm`) và tính điểm phần trăm khớp hành vi.

---

## 5. Chạy Kiểm thử Tự động (Automated Verification)

Hệ thống đi kèm một kịch bản kiểm thử độc lập giúp chạy toàn bộ luồng nghiệp vụ tự động từ login, phân quyền, CRUD vụ án cho đến ghi nhận log kiểm toán.

Chạy kiểm thử bằng lệnh:
```bash
venv/bin/python3 /Users/quochuy/.gemini/antigravity-ide/brain/3c973060-f71d-4648-8d40-b7f344e887f6/scratch/verify_app.py
```
Nếu màn hình thông báo `TẤT CẢ CÁC BÀI KIỂM TRA ĐỀU VƯỢT QUA THÀNH CÔNG!` thì mọi tính năng của hệ thống đã hoạt động chính xác tuyệt đối.
# investigation_assistant
# investigation_assistant
