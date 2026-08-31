import os
import json
import logging
from typing import List, Dict, Any, Optional

from app.schemas.analysis import ExtractedEntitiesSchema, SuggestedChargeSchema
from app.core.config import settings

logger = logging.getLogger("uvicorn.error")

class GNNService:
    _graph_data: Dict[str, Any] = {}

    @classmethod
    def load_graph(cls) -> None:
        """
        Loads the legal knowledge graph into memory.
        """
        graph_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 
            "data", 
            "legal_knowledge_graph.json"
        )
        if not os.path.exists(graph_path):
            logger.error(f"GNNService: Tệp đồ thị tri thức không tồn tại tại: {graph_path}")
            return

        try:
            with open(graph_path, "r", encoding="utf-8") as f:
                cls._graph_data = json.load(f)
            logger.info(f"GNNService: Đã nạp đồ thị tri thức pháp luật ({len(cls._graph_data.get('nodes', []))} đỉnh, {len(cls._graph_data.get('edges', []))} cạnh).")
        except Exception as e:
            logger.error(f"GNNService: Lỗi khi nạp đồ thị tri thức: {str(e)}")

    @classmethod
    def match_charge(cls, entities: ExtractedEntitiesSchema) -> List[SuggestedChargeSchema]:
        """
        Maps extracted entities to Legal Knowledge Graph nodes, evaluates elements,
        and outputs suggestions with crime competition warnings.
        """
        if not cls._graph_data:
            cls.load_graph()

        behavior = (entities.objective_behavior or "").lower()
        damage = entities.consequence or 0.0

        suggestions: List[SuggestedChargeSchema] = []
        matched_articles = []

        # 1. Map behavior to Article nodes using graph attributes
        nodes = cls._graph_data.get("nodes", [])
        for node in nodes:
            if node.get("type") == "Article":
                props = node.get("properties", {})
                ten_dieu = props.get("ten_dieu", "").lower()
                noi_dung = props.get("noi_dung", "").lower()
                dieu_id = node.get("id")
                dieu_no = int(dieu_id.replace("dieu_", ""))

                # Check if behavior keyword hits this node's keywords
                keywords = props.get("keywords", [])
                matched_kws = [kw for kw in keywords if kw.lower() in behavior]
                
                # Check for explicit behavior matches
                if (any(kw in behavior for kw in ["trộm", "lén lút", "cạy cửa"]) and dieu_no == 173) or \
                   (any(kw in behavior for kw in ["cướp", "khống chế", "dùng vũ lực"]) and dieu_no == 168) or \
                   (any(kw in behavior for kw in ["cưỡng đoạt", "đe dọa dùng vũ lực", "uy hiếp"]) and dieu_no == 170) or \
                   (any(kw in behavior for kw in ["lừa đảo", "gian dối"]) and dieu_no == 174) or \
                   (any(kw in behavior for kw in ["lạm dụng tín nhiệm", "tín nhiệm", "vay mượn", "thuê xe"]) and dieu_no == 175) or \
                   (any(kw in behavior for kw in ["tham ô", "thủ quỹ"]) and dieu_no == 353) or \
                   (any(kw in behavior for kw in ["che giấu"]) and dieu_no == 389) or \
                   matched_kws:
                    matched_articles.append((dieu_no, props.get("ten_dieu", "")))

        # 2. Select appropriate Clause based on damage/consequence thresholds
        for dieu_no, ten_dieu in matched_articles:
            clause = 1
            clause_details = "Phạt cải tạo không giam giữ đến 03 năm hoặc phạt tù từ 06 tháng đến 03 năm."

            if dieu_no == 173:  # Trộm cắp
                if damage >= 500_000_000:
                    clause = 4
                    clause_details = "Khoản 4 Điều 173: Chiếm đoạt tài sản trị giá 500.000.000 đồng trở lên (Khung hình phạt: Tù từ 12 năm đến 20 năm)."
                elif damage >= 200_000_000:
                    clause = 3
                    clause_details = "Khoản 3 Điều 173: Chiếm đoạt tài sản trị giá từ 200.000.000 đồng đến dưới 500.000.000 đồng (Khung hình phạt: Tù từ 07 năm đến 15 năm)."
                elif damage >= 50_000_000:
                    clause = 2
                    clause_details = "Khoản 2 Điều 173: Chiếm đoạt tài sản trị giá từ 50.000.000 đồng đến dưới 200.000.000 đồng (Khung hình phạt: Tù từ 02 năm đến 07 năm)."
                else:
                    clause = 1
                    clause_details = f"Khoản 1 Điều 173: Chiếm đoạt tài sản trị giá từ 2.000.000 đồng đến dưới 50.000.000 đồng hoặc dưới 2.000.000 đồng nhưng gây ảnh hưởng xấu (Khung hình phạt: Cải tạo không giam giữ đến 03 năm hoặc phạt tù từ 06 tháng đến 03 năm)."

            elif dieu_no == 174:  # Lừa đảo
                if damage >= 500_000_000:
                    clause = 4
                    clause_details = "Khoản 4 Điều 174: Chiếm đoạt tài sản trị giá 500.000.000 đồng trở lên (Khung hình phạt: Tù từ 12 năm đến 20 năm hoặc tù chung thân)."
                elif damage >= 200_000_000:
                    clause = 3
                    clause_details = "Khoản 3 Điều 174: Chiếm đoạt tài sản trị giá từ 200.000.000 đồng đến dưới 500.000.000 đồng (Khung hình phạt: Tù từ 07 năm đến 15 năm)."
                elif damage >= 50_000_000:
                    clause = 2
                    clause_details = "Khoản 2 Điều 174: Chiếm đoạt tài sản trị giá từ 50.000.000 đồng đến dưới 200.000.000 đồng (Khung hình phạt: Tù từ 02 năm đến 07 năm)."
                else:
                    clause = 1
                    clause_details = "Khoản 1 Điều 174: Chiếm đoạt tài sản trị giá từ 2.000.000 đồng đến dưới 50.000.000 đồng (Khung hình phạt: Cải tạo không giam giữ đến 03 năm hoặc phạt tù từ 06 tháng đến 03 năm)."

            elif dieu_no == 168:  # Cướp
                if damage >= 500_000_000:
                    clause = 4
                    clause_details = "Khoản 4 Điều 168: Chiếm đoạt tài sản trị giá 500.000.000 đồng trở lên (Khung hình phạt: Tù từ 18 năm đến 20 năm hoặc tù chung thân)."
                elif damage >= 200_000_000:
                    clause = 3
                    clause_details = "Khoản 3 Điều 168: Chiếm đoạt tài sản trị giá từ 200.000.000 đồng đến dưới 500.000.000 đồng (Khung hình phạt: Tù từ 12 năm đến 20 năm)."
                elif damage >= 50_000_000:
                    clause = 2
                    clause_details = "Khoản 2 Điều 168: Chiếm đoạt tài sản trị giá từ 50.000.000 đồng đến dưới 200.000.000 đồng (Khung hình phạt: Tù từ 07 năm đến 15 năm)."
                else:
                    clause = 1
                    clause_details = "Khoản 1 Điều 168: Dùng vũ lực, đe dọa dùng vũ lực ngay tức khắc hoặc có hành vi khác làm cho người bị tấn công lâm vào tình trạng không thể chống cự được nhằm chiếm đoạt tài sản (Khung hình phạt: Tù từ 03 năm đến 10 năm)."

            elif dieu_no == 170:  # Cưỡng đoạt
                if damage >= 500_000_000:
                    clause = 4
                    clause_details = "Khoản 4 Điều 170: Chiếm đoạt tài sản trị giá 500.000.000 đồng trở lên (Khung hình phạt: Tù từ 12 năm đến 20 năm)."
                elif damage >= 200_000_000:
                    clause = 3
                    clause_details = "Khoản 3 Điều 170: Chiếm đoạt tài sản trị giá từ 200.000.000 đồng đến dưới 500.000.000 đồng (Khung hình phạt: Tù từ 07 năm đến 15 năm)."
                elif damage >= 50_000_000:
                    clause = 2
                    clause_details = "Khoản 2 Điều 170: Chiếm đoạt tài sản trị giá từ 50.000.000 đồng đến dưới 200.000.000 đồng (Khung hình phạt: Tù từ 03 năm đến 09 năm)."
                else:
                    clause = 1
                    clause_details = "Khoản 1 Điều 170: Đe dọa dùng vũ lực hoặc có thủ đoạn khác uy hiếp tinh thần người khác nhằm chiếm đoạt tài sản (Khung hình phạt: Tù từ 01 năm đến 05 năm)."

            elif dieu_no == 175:  # Lạm dụng tín nhiệm
                if damage >= 500_000_000:
                    clause = 4
                    clause_details = "Khoản 4 Điều 175: Chiếm đoạt tài sản trị giá 500.000.000 đồng trở lên (Khung hình phạt: Tù từ 12 năm đến 20 năm)."
                elif damage >= 200_000_000:
                    clause = 3
                    clause_details = "Khoản 3 Điều 175: Chiếm đoạt tài sản trị giá từ 200.000.000 đồng đến dưới 500.000.000 đồng (Khung hình phạt: Tù từ 05 năm đến 12 năm)."
                elif damage >= 50_000_000:
                    clause = 2
                    clause_details = "Khoản 2 Điều 175: Chiếm đoạt tài sản trị giá từ 50.000.000 đồng đến dưới 200.000.000 đồng (Khung hình phạt: Tù từ 02 năm đến 07 năm)."
                else:
                    clause = 1
                    clause_details = "Khoản 1 Điều 175: Vay, mượn, thuê tài sản của người khác hoặc nhận được tài sản của người khác bằng các hình thức hợp đồng rồi dùng thủ đoạn gian dối hoặc bỏ trốn để chiếm đoạt tài sản đó trị giá từ 4.000.000 đồng đến dưới 50.000.000 đồng (Khung hình phạt: Cải tạo không giam giữ đến 03 năm hoặc phạt tù từ 06 tháng đến 03 năm)."

            conflict_warning = None
            
            # Detect crime competition (Cạnh tranh tội danh)
            matched_article_ids = [m[0] for m in matched_articles]
            
            # Case 1: Cướp tài sản (168) vs Cưỡng đoạt tài sản (170)
            if dieu_no == 168 and 170 in matched_article_ids:
                conflict_warning = (
                    "CẢNH BÁO CẠNH TRANH TỘI DANH: Phát hiện tình tiết giao thoa giữa Tội cướp tài sản (Điều 168) và Tội cưỡng đoạt tài sản (Điều 170). "
                    "Yêu cầu làm rõ: Hành vi đe dọa dùng vũ lực có mang tính chất 'ngay tức khắc' và làm tê liệt ý chí kháng cự của nạn nhân (Điều 168) "
                    "hay chỉ là đe dọa vũ lực mang tính chất uy hiếp tinh thần để ép giao tài sản sau đó (Điều 170)."
                )
            elif dieu_no == 170 and 168 in matched_article_ids:
                conflict_warning = (
                    "CẢNH BÁO CẠNH TRANH TỘI DANH: Phát hiện tình tiết giao thoa giữa Tội cưỡng đoạt tài sản (Điều 170) và Tội cướp tài sản (Điều 168). "
                    "Yêu cầu làm rõ: Đe dọa dùng vũ lực ngay tức khắc (Điều 168) hay đe dọa dùng vũ lực uy hiếp tinh thần để ép giao tài sản (Điều 170)."
                )
                
            # Case 2: Trộm cắp tài sản (173) vs Lạm dụng tín nhiệm (175)
            if dieu_no == 173 and 175 in matched_article_ids:
                conflict_warning = (
                    "CẢNH BÁO CẠNH TRANH TỘI DANH: Phát hiện tình tiết giao thoa giữa Tội trộm cắp tài sản (Điều 173) và Tội lạm dụng tín nhiệm chiếm đoạt tài sản (Điều 175). "
                    "Yêu cầu làm rõ: Bị can đã thực hiện hành vi 'lén lút, bí mật' lấy tài sản (Điều 173) hay nhận tài sản thông qua giao dịch hợp đồng hợp pháp rồi mới nảy sinh ý định chiếm đoạt (Điều 175)."
                )
            elif dieu_no == 175 and 173 in matched_article_ids:
                conflict_warning = (
                    "CẢNH BÁO CẠNH TRANH TỘI DANH: Phát hiện tình tiết giao thoa giữa Tội lạm dụng tín nhiệm chiếm đoạt tài sản (Điều 175) và Tội trộm cắp tài sản (Điều 173). "
                    "Yêu cầu làm rõ: Giao dịch hợp đồng trước khi chiếm đoạt (Điều 175) hay lén lút lấy tài sản ngay từ đầu (Điều 173)."
                )

            suggestions.append(SuggestedChargeSchema(
                article_id=dieu_no,
                title=ten_dieu,
                applicable_clause=clause,
                clause_details=clause_details,
                conflict_warning=conflict_warning
            ))

        return suggestions
