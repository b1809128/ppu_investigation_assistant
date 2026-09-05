# Lộ Trình Nâng Cấp Chuyên Sâu Hệ Thống PPU Investigation Assistant (4 Giai Đoạn)

Tài liệu này đóng vai trò là **Bản Kế Hoạch Thực Thi (Execution Plan)** được chia làm 4 Giai đoạn phát triển tuần tự. Mỗi khi hoàn thành một giai đoạn, hệ thống sẽ cập nhật trạng thái tick hoàn thành `[x]` và yêu cầu bấm **Proceed** để chuyển sang thực hiện giai đoạn kế tiếp.

---

## 📌 Bảng Cập Nhật Tiến Độ Các Giai Đoạn

- [ ] **Giai đoạn 1: Nâng cấp Đồ thị Tri thức Đa tầng & Động cơ GNN Reasoning Path** *(Đang chờ kích hoạt)*
- [ ] **Giai đoạn 2: Động cơ Giải thích AI (XAI) & Phân định Cạnh tranh Tội danh Nâng cao**
- [ ] **Giai đoạn 3: Phân tích Mâu thuẫn Lời khai & Lỗ hổng Chứng cứ (Evidence Contradiction Engine)**
- [ ] **Giai đoạn 4: Bộ Thẩm định Chất lượng Legal AI Benchmark Suite & Xuất Báo cáo Nghiên cứu**

---

## 🚀 GIAI ĐOẠN 1: Nâng Cấp Đồ Thị Tri Thức Đa Tầng & Động Cơ GNN Reasoning Path

### Mục tiêu
Mở rộng đồ thị tri thức pháp luật trong [`legal_knowledge_graph.json`](file:///Users/quochuy/QH_Code/PPU_SYSTEM/ppu_investigation_assistant/app/data/legal_knowledge_graph.json), xây dựng cấu trúc đa tầng (Heterogeneous Graph Topology) và cập nhật [`gnn_service.py`](file:///Users/quochuy/QH_Code/PPU_SYSTEM/ppu_investigation_assistant/app/services/gnn_service.py) để tính toán đường đi truy vấn tri thức (Graph Reasoning Path).

### Các công việc triển khai
1. **[NEW] [app/data/generate_legal_graph.py](file:///Users/quochuy/QH_Code/PPU_SYSTEM/ppu_investigation_assistant/app/data/generate_legal_graph.py)**: Cập nhật script sinh đồ thị tri thức pháp luật mở rộng cho các Điều 123, 134, 168, 170, 171, 173, 174, 175, 353, 354 BLHS 2015.
2. **[MODIFY] [app/services/gnn_service.py](file:///Users/quochuy/QH_Code/PPU_SYSTEM/ppu_investigation_assistant/app/services/gnn_service.py)**: Bổ sung thuật toán tính toán đường đi đồ thị (Shortest Path & Attention Weights) giữa các nút Hành vi, Hung khí và Điều luật định tội.
3. **[MODIFY] [app/schemas/graph.py](file:///Users/quochuy/QH_Code/PPU_SYSTEM/ppu_investigation_assistant/app/schemas/graph.py)**: Bổ sung các trường `reasoning_path` và `confidence_score` cho đồ thị vụ án.

### Kiểm thử & Xác minh Giai đoạn 1
- Running unit test: `pytest app/tests/test_dl_engine.py`.
- Lệnh kiểm tra build frontend: `npm run build`.

---

## 🚀 GIAI ĐOẠN 2: Động Cơ Giải Thích AI (XAI) & Phân Định Cạnh Tranh Tội Danh Nâng Cao

### Mục tiêu
Xây dựng mô đun XAI (Explainable AI) trực quan hóa luồng lập luận của AI giải thích tại sao chọn tội danh chính thay vì tội danh cạnh tranh, đồng thời hiển thị sơ đồ phân định trên giao diện Frontend.

### Các công việc triển khai
1. **[MODIFY] [app/services/matching_engine.py](file:///Users/quochuy/QH_Code/PPU_SYSTEM/ppu_investigation_assistant/app/services/matching_engine.py)**: Nâng cấp thuật toán so khớp 4 yếu tố cấu thành (KT, KQ, CT, CQ) trả về bảng giải thích XAI.
2. **[MODIFY] [frontend/src/components/CaseGraphVisualizer.tsx](file:///Users/quochuy/QH_Code/PPU_SYSTEM/ppu_investigation_assistant/frontend/src/components/CaseGraphVisualizer.tsx)**: Thêm chế độ hiển thị "Luồng Lập Luận XAI Graph Path" trực quan trên đồ thị.
3. **[MODIFY] [frontend/src/components/CaseMatchingWorkbench.tsx](file:///Users/quochuy/QH_Code/PPU_SYSTEM/ppu_investigation_assistant/frontend/src/components/CaseMatchingWorkbench.tsx)**: Thêm tab "Giải thích Lập luận Pháp lý XAI".

### Kiểm thử & Xác minh Giai đoạn 2
- Kiểm tra hiển thị luồng lập luận XAI trên màn hình Workbench.
- Kiểm tra tính nhất quán với các tội danh cạnh tranh (Điều 168 vs 171, Điều 123 vs 134).

---

## 🚀 GIAI ĐOẠN 3: Phân Tích Mâu Thuẫn Lời Khai & Lỗ Hổng Chứng Cứ (Evidence Contradiction Engine)

### Mục tiêu
Tự động so sánh lời khai giữa các bị can đồng phạm và người tham gia tố tụng để chỉ ra điểm mâu thuẫn về thời gian, địa điểm, vai trò và công cụ gây án.

### Các công việc triển khai
1. **[MODIFY] [app/services/procedural_service.py](file:///Users/quochuy/QH_Code/PPU_SYSTEM/ppu_investigation_assistant/app/services/procedural_service.py)**: Bổ sung động cơ phát hiện xung đột mâu thuẫn chứng cứ (Contradiction Matrix).
2. **[NEW] [frontend/src/components/EvidenceContradictionMatrix.tsx](file:///Users/quochuy/QH_Code/PPU_SYSTEM/ppu_investigation_assistant/frontend/src/components/EvidenceContradictionMatrix.tsx)**: Xây dựng bảng ma trận đối sánh mâu thuẫn lời khai bị can.

### Kiểm thử & Xác minh Giai đoạn 3
- Đánh giá trên vụ án mẫu có nhiều bị can đồng phạm.

---

## 🚀 GIAI ĐOẠN 4: Bộ Thẩm Định Chất Lượng Legal AI Benchmark Suite & Xuất Báo Cáo Nghiên Cứu

### Mục tiêu
Đánh giá định lượng toàn bộ hệ thống trên bộ dữ liệu kiểm thử hình sự tiêu chuẩn và xuất báo cáo thẩm định khoa học.

### Các công việc triển khai
1. **[NEW] [app/tests/test_legal_benchmark.py](file:///Users/quochuy/QH_Code/PPU_SYSTEM/ppu_investigation_assistant/app/tests/test_legal_benchmark.py)**: Xây dựng bộ test benchmark 20+ tình huống vụ án mẫu.
2. **[NEW] [docs/legal_ai_evaluation_report.md](file:///Users/quochuy/QH_Code/PPU_SYSTEM/ppu_investigation_assistant/docs/legal_ai_evaluation_report.md)**: Tổng hợp báo cáo đánh giá Precision, Recall, F1-Score.

---

## 📋 Quy Trình Thực Hiện
1. Điều tra viên duyệt lộ trình và bấm **Proceed** để bắt đầu **Giai đoạn 1**.
2. Sau khi hoàn thành Giai đoạn 1 và vượt qua các bước kiểm thử, hệ thống sẽ đánh dấu `[x] Giai đoạn 1` hoàn thành và dừng lại chờ bạn bấm **Proceed** để thực hiện tiếp **Giai đoạn 2**.
