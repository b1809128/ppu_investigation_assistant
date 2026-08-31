# Hướng Dẫn Vận Hành & Cơ Chế Hoạt Động Của Mô Hình GNN & CNN

Tài liệu này mô tả chi tiết cơ chế vận hành thực tế của mô hình học sâu lai (Hybrid Deep Learning) kết hợp **Mạng Nơ-ron Tích chập (CNN)** và **Mạng Nơ-ron Đồ thị (GNN)** trong việc phân tích hồ sơ vụ việc và đối chiếu luật pháp.

---

## 1. Kiến Trúc Luồng Hoạt Động Tổng Quan

Quy trình xử lý một vụ án từ văn bản tóm tắt đến đề xuất điều luật tối ưu được chia làm 3 bước nối tiếp:

```
[Văn bản tóm tắt vụ việc / Lời khai]
           │
           ├─────────────────────────┐
           ▼                         ▼
   ┌───────────────┐         ┌───────────────┐
   │   TextCNN     │         │   Trích xuất  │
   │ (PhoBERT Embd)│         │Thực thể & Quan│
   └───────┬───────┘         │  hệ (NER/RE)  │
           │                 └───────┬───────┘
           │                         ▼
           │                 ┌───────────────┐
           │                 │ Đồ thị Vụ án  │
           │                 │ (Case Graph)  │
           │                 └───────┬───────┘
           │                         ▼
           │                 ┌───────────────┐
           │                 │      GNN      │
           │                 │ (GAT/GCN Embd)│◄─── [Đồ thị Luật pháp]
           │                 └───────┬───────┘     (legal_knowledge_graph.json)
           │                         │
           ▼                         ▼
   ┌─────────────────────────────────┴─┐
   │ Động cơ Phân loại Lai (Hybrid)    │
   └────────────────┬──────────────────┘
                    ▼
     [Gợi ý Điều luật & Đường dẫn XAI]
```

---

## 2. Chi Tiết Các Bước Vận Hành

### Bước 1: Phân tích Văn bản Cục bộ bằng TextCNN
1. **Tiền xử lý & Embedding:** Văn bản tóm tắt hành vi vụ án được mã hóa thành các vector đặc trưng ngữ nghĩa bằng mô hình ngôn ngữ tiếng Việt tiền huấn luyện (**PhoBERT** hoặc **ViDeBERTa**).
2. **TextCNN (CNN 1D):** Trượt các bộ lọc tích chập (Convolutional Kernels) với nhiều kích thước khác nhau qua chuỗi vector từ để bắt trọn các cụm từ hành vi đặc trưng:
   * *Kernel cỡ 3:* `"dùng dao găm"`, `"đe dọa dùng"`.
   * *Kernel cỡ 4:* `"lén lút bẻ khóa"`, `"lợi dụng chức vụ"`.
3. **Max-Pooling:** Giữ lại các tín hiệu kích hoạt mạnh nhất để đưa ra dự đoán phân loại thô về các điều luật hình sự có khả năng bị vi phạm cao nhất.

### Bước 2: Dựng Đồ thị Vụ án (Case Graph Construction)
Song song với TextCNN, hệ thống phân tích hồ sơ để trích xuất các thực thể và mối quan hệ nhằm dựng lên **Đồ thị Vụ án (Case Graph)** theo cấu trúc [`graph.py`](file:///Users/quochuy/QH_Code/PPU_SYSTEM/ppu_investigation_assistant/app/schemas/graph.py):
* **Các nút (Nodes):**
  * `suspect_1` (Bị can: Nguyễn Văn A)
  * `action_1` (Hành vi: Dùng vũ lực khống chế)
  * `asset_1` (Tài sản chiếm đoạt: 50.000.000 VNĐ)
* **Các quan hệ (Edges):**
  * `(suspect_1) -[THỰC_HIỆN]-> (action_1)`
  * `(action_1) -[CHIẾM_ĐOẠT]-> (asset_1)`

### Bước 3: So khớp Đồ thị bằng GNN (Graph Attention Network)
1. **Nạp Đồ thị Luật pháp (Legal Ontology Graph):** Hệ thống load đồ thị tri thức luật pháp mẫu từ [`legal_knowledge_graph.json`](file:///Users/quochuy/QH_Code/PPU_SYSTEM/ppu_investigation_assistant/app/data/legal_knowledge_graph.json). Đồ thị này đã định nghĩa sẵn các nút điều luật (`Article`), khoản (`Clause`) và các dấu hiệu cấu thành pháp lý (`CrimeElement`).
2. **Lan truyền Thông tin Đồ thị (Graph Embedding):** Mô hình GAT (Graph Attention Network) thực hiện việc tổng hợp thông tin từ các đỉnh lân cận trên cả hai đồ thị:
   * Trên đồ thị luật: Nút `Clause 1` tích tụ thông tin từ nút `element_violence` (Sử dụng vũ lực).
   * Trên đồ thị vụ án: Nút `suspect_1` tích tụ thông tin từ hành vi `action_1` (Dùng vũ lực khống chế).
3. **Dự đoán liên kết (Link Prediction):** Mô hình tính toán xác suất liên kết giữa nút `suspect_1` (trên Case Graph) và nút `Clause` (trên Legal Graph). Nếu xác suất liên kết cao vượt ngưỡng, AI sẽ đề xuất tội danh đó.

---

## 3. Khả Năng Giải Thích Của AI (Explainable AI - XAI)

Điểm vượt trội của mô hình đồ thị so với học sâu dạng "hộp đen" truyền thống là khả năng giải thích nguồn gốc quyết định. Đường dẫn kết nối thực thể (Path-based explanation) được AI trích xuất và hiển thị trực quan cho điều tra viên:

* **Kịch bản thực tế:** Bị can dùng dao khống chế nạn nhân để lấy điện thoại.
* **Đường dẫn giải thích của GNN:**
  $$\text{Bị can (Suspect A)} \xrightarrow{\text{Thực hiện}} \text{Hành vi (Dùng dao khống chế)} \xrightarrow{\text{Tương đồng}} \text{Dấu hiệu (Sử dụng vũ lực)}$$
  $$\text{Dấu hiệu (Sử dụng vũ lực)} \xrightarrow{\text{Cấu thành}} \text{Khoản 1 (Clause 1)} \xrightarrow{\text{Thuộc về}} \text{Điều 168 (Tội cướp tài sản)}$$

---

## 4. Cơ Chế Dự Phòng (Fallback Mechanism)

Nhằm đảm bảo hệ thống vận hành liên tục 24/7 trong mọi môi trường (kể cả máy trạm offline cấu hình thấp không hỗ trợ GPU):
1. **Ưu tiên Deep Learning:** Nếu phát hiện các thư viện deep learning (PyTorch, ONNX Runtime) và có sẵn cấu hình trọng số mô hình, hệ thống sẽ kích hoạt **Hybrid Engine**.
2. **Tự động Fallback:** Nếu xảy ra lỗi khởi tạo, thiếu bộ nhớ GPU hoặc không load được mô hình, hệ thống sẽ ghi log lỗi và tự động chuyển hướng sang **Rule-based Keyword Engine** trong [`matching_engine.py`](file:///Users/quochuy/QH_Code/PPU_SYSTEM/ppu_investigation_assistant/app/services/matching_engine.py). Điều này đảm bảo điều tra viên vẫn nhận được kết quả đối sánh luật sơ bộ dựa trên từ khóa tĩnh và định lượng tiền/độ tuổi mà không bị treo phần mềm.
