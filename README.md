# HỆ THỐNG TRỢ LÝ AI HỖ TRỢ ĐIỀU TRA HÌNH SỰ & ĐỐI CHIẾU PHÁP LÝ (PPU INVESTIGATION ASSISTANT)

**Hệ thống phần mềm nghiệp vụ chuyên sâu phục vụ Điều tra viên, Kiểm sát viên, Cán bộ tố tụng và Hội đồng Nghiên cứu Khoa học Trường Đại học Cảnh sát nhân dân (ĐH CSND).**

*Môi trường vận hành: 100% Offline / Air-gapped trong Mạng nội bộ cơ quan điều tra (LAN).*

---

## 🏛️ 1. CÁC ĐIỂM NỔI BẬT VỀ KỸ THUẬT VÀ NGHIỆP VỤ

* **Đồ thị Tri thức Pháp luật Đa tầng (Legal Knowledge Graph Topology):**
  Khởi tạo cấu trúc đồ thị **172 Đỉnh (Nodes)** và **198 Cạnh (Edges)** biểu diễn tri thức Bộ luật Hình sự 2015 (sửa đổi 2017) và Bộ luật Tố tụng Hình sự 2015.
* **Động cơ Phân định Cạnh tranh Tội danh (Graph Distillation Operator):**
  Tự động lọc đồ thị phân định các cặp tội danh giáp ranh phức tạp (*Cướp vs Cướp giật*, *Giết người chưa đạt vs Cố ý gây thương tích*).
* **Động cơ Giải thích AI (XAI Reasoning Path Overlay):**
  Trích xuất luồng suy luận 5 bước minh bạch và hiển thị trực tiếp trên Sơ đồ Đồ thị mối quan hệ đối tượng (`CaseGraphVisualizer`).
* **Cá thể hóa Trách nhiệm Hình sự & Đồng phạm (Multi-Suspect Module):**
  Hỗ trợ xử lý vụ án nhiều bị can (Điều 17 BLHS), ranh giới độ tuổi chịu TNHS (Điều 12 BLHS) và quy tắc nhân thân tốt không tiền án tiền sự (Điều 52, 53 BLHS).
* **Ma trận Mâu thuẫn Lời khai & Chứng cứ (Evidence Contradiction Matrix):**
  Phát hiện bất đồng về vai trò chủ mưu/giúp sức, đặc điểm hung khí gây án, mốc thời gian ngoại phạm và thiệt hại tài sản.
* **Bộ Thẩm định Định lượng Legal AI Benchmark Suite:**
  Đạt độ chính xác định tội **95.45%** (21/22 vụ án khớp chuẩn) và thời gian phản hồi **0.31 ms** siêu tốc.

---

## 📂 2. HỒ SƠ TÀI LIỆU BÁO CÁO HỘI ĐỒNG KHOA HỌC (ĐẠI HỌC CẢNH SÁT NHÂN DÂN)

Toàn bộ báo cáo đặc tả và thuyết minh đề tài được lưu giữ tại thư mục `docs/bao_cao_hoi_dong_dhcsnd/`:

1. [01_dac_ta_he_thong_va_bao_cao_chuc_nang.md](file:///Users/quochuy/QH_Code/PPU_SYSTEM/ppu_investigation_assistant/docs/bao_cao_hoi_dong_dhcsnd/01_dac_ta_he_thong_va_bao_cao_chuc_nang.md): Bản đặc tả hệ thống và báo cáo chi tiết toàn bộ chức năng nghiệp vụ.
2. [02_thuyet_minh_de_tai_khoa_hoc_dhcsnd.md](file:///Users/quochuy/QH_Code/PPU_SYSTEM/ppu_investigation_assistant/docs/bao_cao_hoi_dong_dhcsnd/02_thuyet_minh_de_tai_khoa_hoc_dhcsnd.md): Tờ trình thuyết minh đề tài KH&CN trình Hội đồng Nghiên cứu Khoa học ĐH CSND.
3. [03_huong_dan_van_hanh_dieu_tra_vien_csnd.md](file:///Users/quochuy/QH_Code/PPU_SYSTEM/ppu_investigation_assistant/docs/bao_cao_hoi_dong_dhcsnd/03_huong_dan_van_hanh_dieu_tra_vien_csnd.md): Hướng dẫn vận hành 5 bước dành cho Điều tra viên, Giảng viên và Học viên ĐH CSND.
4. [04_danh_gia_dinh_luong_legal_ai_benchmark.md](file:///Users/quochuy/QH_Code/PPU_SYSTEM/ppu_investigation_assistant/docs/bao_cao_hoi_dong_dhcsnd/04_danh_gia_dinh_luong_legal_ai_benchmark.md): Báo cáo đánh giá định lượng 22 kịch bản hình sự và kết quả benchmark.

---

## 🛠️ 3. CÔNG NGHỆ VÀ KHỞI CHẠY HỆ THỐNG

### Công nghệ sử dụng
* **Frontend:** React 19 + TypeScript + Vite + TailwindCSS v4 + Chart.js + HTML5 Canvas Visualizer.
* **Backend:** FastAPI (Python 3.14) + SQLAlchemy ORM + Pydantic v2.
* **Deep Learning Engine:** PyTorch Geometric + NetworkX + GNNExplainer.

### Khởi chạy Hệ thống

Khởi chạy đồng thời cả Backend (Port 8000) và Frontend (Port 5173) bằng lệnh duy nhất:
```bash
./run_app.py
```

### Tài khoản mặc định:
- **Điều tra viên:** `dtv` / mật khẩu: `dtv`
- **Lãnh đạo Cơ quan Điều tra:** `leader` / mật khẩu: `leader`
- **Quản trị viên:** `admin` / mật khẩu: `admin`

### Khởi chạy Bộ Kiểm thử Benchmark:
```bash
PYTHONPATH=. ./venv/bin/pytest app/tests/test_legal_benchmark.py app/tests/test_dl_engine.py app/tests/test_gnn_service.py app/tests/test_procedural_service.py -s
```
*(Kết quả: 24/24 tests PASSED 100%, Matching Accuracy: 95.45%, Execution Speed: 0.31ms).*
