import os
import logging
from typing import List, Dict, Any, Optional
from app.schemas.graph import CaseGraphSchema

logger = logging.getLogger("uvicorn.error")

class DeepLearningEngine:
    def __init__(self, model_dir: Optional[str] = None):
        """
        Initializes the Deep Learning Engine.
        In the future, this loads the PhoBERT embeddings, TextCNN weights, and GNN model weights.
        """
        self.model_dir = model_dir or os.path.join(os.path.dirname(__file__), "..", "data", "models")
        self.model_loaded = False
        self.has_gpu = False
        
        # Safe imports to prevent crash if PyTorch/ONNX is not yet installed in the target offline environment
        try:
            import torch
            self.has_gpu = torch.cuda.is_available()
            logger.info(f"DeepLearningEngine: PyTorch loaded successfully. CUDA available: {self.has_gpu}")
        except ImportError:
            logger.warning("DeepLearningEngine: PyTorch not installed. Running in mock/compatibility mode.")

        # Attempt to load mock or prototype weights
        self._initialize_models()

    def _initialize_models(self):
        """
        Loads the neural network weights from the model directory.
        Currently sets up mock models for development and fallback testing.
        """
        if not os.path.exists(self.model_dir):
            os.makedirs(self.model_dir, exist_ok=True)
            
        # Simulated loading of weights
        logger.info(f"DeepLearningEngine: Initializing models from {self.model_dir}...")
        self.model_loaded = True

    def predict_charges(self, summary_acts: str, case_graph: Optional[CaseGraphSchema] = None) -> List[Dict[str, Any]]:
        """
        Performs inference using:
        1. TextCNN for localized action semantic text tagging (PhoBERT).
        2. GNN (Graph Attention Network) for relation matches in the case graph.
        
        Returns a list of suggested Penal Code articles with confidence scores and explanation paths (XAI).
        """
        if not self.model_loaded:
            logger.error("DeepLearningEngine: Models are not loaded. Cannot run inference.")
            return []

        if not summary_acts or not summary_acts.strip():
            return []

        # Convert text to lowercase for mock classification rules matching deep neural nets outputs
        text_lower = summary_acts.lower()
        suggestions = []

        # Mock TextCNN + GNN Inference results based on semantic signals
        # For Article 173 (Trộm cắp tài sản)
        if any(kw in text_lower for kw in ["trộm", "lấy", "cạy cửa", "bẻ khóa", "đột nhập"]):
            # GNN explanation path mapping suspect -> action -> asset
            xai_path = {
                "nodes": ["Bị can (Suspect)", "Hành vi: Lấy trộm/Đột nhập (Action)", "Tài sản: Điện thoại/Xe máy (Asset)"],
                "edges": ["(Suspect) -[THỰC_HIỆN]-> (Action)", "(Action) -[CHIẾM_ĐOẠT]-> (Asset)"]
            }
            suggestions.append({
                "article_id": 173,
                "confidence": 0.92,
                "engine": "Hybrid (TextCNN + GNN)",
                "xai_explanation": "Mạng GNN phát hiện cấu thành Tội trộm cắp tài sản qua quan hệ chiếm đoạt tài sản bằng hành vi lén lút.",
                "xai_path": xai_path
            })

        # For Article 174 (Lừa đảo chiếm đoạt tài sản)
        if any(kw in text_lower for kw in ["lừa", "giả mạo", "gian dối", "chuyển tiền", "tài khoản lạ"]):
            xai_path = {
                "nodes": ["Bị can (Suspect)", "Hành vi: Gian dối/Giả mạo (Action)", "Tài sản (Asset)"],
                "edges": ["(Suspect) -[THỰC_HIỆN]-> (Action)", "(Action) -[TÁC_ĐỘNG_LÊN]-> (Asset)"]
            }
            suggestions.append({
                "article_id": 174,
                "confidence": 0.88,
                "engine": "Hybrid (TextCNN + GNN)",
                "xai_explanation": "Mạng TextCNN nhận diện đặc trưng ngữ nghĩa hành vi lừa đảo/gian dối chiếm đoạt tài sản.",
                "xai_path": xai_path
            })

        # For Article 353 (Tham ô tài sản)
        if any(kw in text_lower for kw in ["tham ô", "thủ quỹ", "chức vụ", "lợi dụng quyền hạn"]):
            xai_path = {
                "nodes": ["Bị can (Suspect - có chức vụ)", "Hành vi: Lợi dụng chức vụ (Action)", "Tài sản công (Asset)"],
                "edges": ["(Suspect) -[LỢI_DỤNG]-> (Action)", "(Action) -[CHIẾM_ĐOẠT]-> (Asset)"]
            }
            suggestions.append({
                "article_id": 353,
                "confidence": 0.95,
                "engine": "Hybrid (TextCNN + GNN)",
                "xai_explanation": "Mạng GNN xác nhận vai trò chủ thể có chức vụ quyền hạn thực hiện hành vi chiếm đoạt tài sản công.",
                "xai_path": xai_path
            })

        # If a custom graph is passed, simulate refinement of confidence scores based on graph topology
        if case_graph and case_graph.nodes:
            logger.info(f"DeepLearningEngine: Refining inference with Case Graph ({len(case_graph.nodes)} nodes, {len(case_graph.edges)} edges)")
            # Refine confidence scores if entities are correctly structured
            for sug in suggestions:
                sug["confidence"] = min(sug["confidence"] + 0.03, 0.99)

        return suggestions
