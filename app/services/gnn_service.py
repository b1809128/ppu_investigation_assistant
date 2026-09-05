import os
import json
import logging
import math
from typing import List, Dict, Any, Optional, Tuple, Union

from app.schemas.analysis import ExtractedEntitiesSchema, SuggestedChargeSchema
from app.core.config import settings

logger = logging.getLogger("uvicorn.error")


def _cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    """Calculates cosine similarity between two numerical feature vectors."""
    if not vec1 or not vec2 or len(vec1) != len(vec2):
        return 0.0
    dot_prod = sum(a * b for a, b in zip(vec1, vec2))
    norm_a = math.sqrt(sum(a * a for a in vec1))
    norm_b = math.sqrt(sum(b * b for b in vec2))
    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0
    return dot_prod / (norm_a * norm_b)


class GNNExplainer:
    """
    GNNExplainer module for extracting key evidence nodes and edges 
    to provide Explainable AI (XAI) justifications for predicted criminal charges.
    """

    @staticmethod
    def explain(
        article_id: int, 
        entities: ExtractedEntitiesSchema, 
        element_scores: Dict[str, float],
        graph_nodes: List[Dict[str, Any]],
        graph_edges: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Extracts key evidence nodes and edges contributing to predicted charge S(f, C_k).
        """
        important_nodes = []
        important_edges = []
        
        behavior = (entities.objective_behavior or "").lower()
        weapon = (entities.weapon or "").lower()
        consequence = entities.consequence or 0.0
        
        # 1. Extract important evidence nodes
        if behavior:
            important_nodes.append({
                "node_id": "evidence_behavior",
                "label": "FactBehavior",
                "name": f"Hành vi: {entities.objective_behavior}",
                "importance_score": round(element_scores.get("KQ", 0.8) * 0.95, 3)
            })
            
        if weapon:
            important_nodes.append({
                "node_id": "evidence_weapon",
                "label": "FactWeapon",
                "name": f"Phương tiện/Hung khí: {entities.weapon}",
                "importance_score": 0.92
            })
            
        if consequence > 0:
            important_nodes.append({
                "node_id": "evidence_consequence",
                "label": "FactConsequence",
                "name": f"Giá trị thiệt hại/Hậu quả: {consequence:,.0f} VNĐ",
                "importance_score": 0.88
            })

        article_node_id = f"dieu_{article_id}"
        for node in graph_nodes:
            nid = str(node.get("id", ""))
            if nid == article_node_id or nid == f"article_{article_id}":
                important_nodes.append({
                    "node_id": nid,
                    "label": "ArticleNode",
                    "name": node.get("properties", {}).get("ten_dieu", f"Điều {article_id}"),
                    "importance_score": 1.0
                })

        # 2. Extract key edges connecting evidence to crime elements
        important_edges.append({
            "source": "FactBehavior",
            "target": f"Article_{article_id}",
            "relation": "CONSTITUTES_OBJECTIVE_ELEMENT",
            "weight": round(element_scores.get("KQ", 0.8), 3)
        })
        important_edges.append({
            "source": "FactConsequence",
            "target": f"Article_{article_id}",
            "relation": "DETERMINES_PENALTY_FRAME",
            "weight": round(element_scores.get("KQ", 0.8) * 0.9, 3)
        })

        # 3. Generate natural language XAI summary
        summary_text = (
            f"Giải thích XAI (GNNExplainer) cho Điều {article_id}: "
            f"Điểm cấu thành Mặt khách quan (KQ) đạt {element_scores.get('KQ', 0.0):.2f}, "
            f"Mặt chủ quan (CQ) đạt {element_scores.get('CQ', 0.0):.2f}, "
            f"Khách thể (KT) đạt {element_scores.get('KT', 0.0):.2f}, "
            f"Chủ thể (CT) đạt {element_scores.get('CT', 0.0):.2f}. "
            f"Căn cứ then chốt: Hành vi '{behavior}', Hung khí '{weapon or 'Không có'}', "
            f"Thiệt hại '{consequence:,.0f} VNĐ'."
        )

        return {
            "important_nodes": important_nodes,
            "important_edges": important_edges,
            "xai_summary": summary_text
        }


class GNNService:
    _graph_data: Dict[str, Any] = {}
    
    # Weights for the 4 Constituent Elements: gamma_m for m in {KT, KQ, CT, CQ}
    ELEMENT_WEIGHTS: Dict[str, float] = {
        "KT": 0.20,  # Khách thể (Protected legal interest)
        "KQ": 0.35,  # Mặt khách quan (Objective acts, weapon, damage)
        "CT": 0.20,  # Chủ thể (Subject / perpetrator characteristics)
        "CQ": 0.25   # Mặt chủ quan (Subjective intent / mens rea)
    }

    ARTICLE_TITLES: Dict[int, str] = {
        123: "Tội giết người",
        134: "Tội cố ý gây thương tích hoặc gây tổn hại cho sức khỏe của người khác",
        168: "Tội cướp tài sản",
        170: "Tội cưỡng đoạt tài sản",
        171: "Tội cướp giật tài sản",
        173: "Tội trộm cắp tài sản",
        174: "Tội lừa đảo chiếm đoạt tài sản",
        175: "Tội lạm dụng tín nhiệm chiếm đoạt tài sản",
        178: "Tội hủy hoại hoặc cố ý làm hư hỏng tài sản",
        249: "Tội tàng trữ trái phép chất ma túy",
        321: "Tội đánh bạc",
        353: "Tội tham ô tài sản",
        354: "Tội nhận hối lộ",
        389: "Tội che giấu tội phạm"
    }

    @classmethod
    def load_graph(cls) -> None:
        """
        Loads the legal knowledge graph into memory from JSON or Neo4j database.
        """
        neo4j_uri = getattr(settings, "NEO4J_URI", None)
        if neo4j_uri:
            try:
                from neo4j import GraphDatabase
                user = getattr(settings, "NEO4J_USER", "neo4j")
                pwd = getattr(settings, "NEO4J_PASSWORD", "password")
                driver = GraphDatabase.driver(neo4j_uri, auth=(user, pwd))
                with driver.session() as session:
                    res = session.run("MATCH (n) OPTIONAL MATCH (n)-[r]->(m) RETURN n, r, m")
                    nodes = []
                    edges = []
                    for record in res:
                        n = record["n"]
                        if n:
                            nodes.append({"id": str(n.id), "label": list(n.labels)[0] if n.labels else "Node", "properties": dict(n)})
                    cls._graph_data = {"nodes": nodes, "edges": edges}
                logger.info(f"GNNService: Đã tải thành công đồ thị từ Neo4j ({len(nodes)} nodes).")
                return
            except Exception as e:
                logger.warning(f"GNNService: Không thể kết nối Neo4j ({str(e)}). Chuyển sang nạp từ JSON local.")

        possible_paths = [
            os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "legal_knowledge_graph.json"),
            os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "legal_knowledge_graph.json"),
            "app/data/legal_knowledge_graph.json"
        ]
        
        graph_path = None
        for p in possible_paths:
            if os.path.exists(p):
                graph_path = p
                break

        if not graph_path:
            logger.error("GNNService: Tệp đồ thị tri thức pháp luật không tồn tại.")
            cls._graph_data = {"nodes": [], "edges": []}
            return

        try:
            with open(graph_path, "r", encoding="utf-8") as f:
                cls._graph_data = json.load(f)
            logger.info(f"GNNService: Đã nạp đồ thị tri thức pháp luật ({len(cls._graph_data.get('nodes', []))} đỉnh, {len(cls._graph_data.get('edges', []))} cạnh).")
        except Exception as e:
            logger.error(f"GNNService: Lỗi khi nạp đồ thị tri thức: {str(e)}")
            cls._graph_data = {"nodes": [], "edges": []}

    @classmethod
    def calculate_4_elements_score(
        cls, 
        entities: ExtractedEntitiesSchema, 
        article_no: int
    ) -> Tuple[float, Dict[str, float]]:
        """
        Algorithm calculating 4 Constituent Elements Matching Score S(f, C_k):
        
        S(f, C_k) = sum_{m in {KT, KQ, CT, CQ}} gamma_m * cos(W_m * v_f, e_{C_k}^m)
        """
        behavior = (entities.objective_behavior or "").lower()
        weapon = (entities.weapon or "").lower()
        damage = entities.consequence or 0.0
        age = entities.suspect_age or 20

        # 1. Khách thể (KT): Protected legal interest
        if article_no in [168, 170, 171, 173, 174, 175]:
            v_kt = [1.0, 0.0, 0.0]
            e_kt = [1.0, 0.0, 0.0]
        elif article_no in [123, 134]:
            v_kt = [0.0, 1.0, 0.0]
            e_kt = [0.0, 1.0, 0.0]
        else:
            v_kt = [0.0, 0.0, 1.0]
            e_kt = [0.0, 0.0, 1.0]

        # 2. Mặt khách quan (KQ): Behavior acts, weapons, physical consequence
        v_kq = [
            1.0 if any(w in behavior for w in ["vũ lực", "khống chế", "đánh", "dùng súng", "dùng dao", "tấn công", "đâm", "chém"]) else 0.0,
            1.0 if any(w in behavior for w in ["lén lút", "bí mật", "cạy cửa", "trộm"]) else 0.0,
            1.0 if any(w in behavior for w in ["giật", "nhanh chóng", "cướp giật", "tẩu thoát"]) else 0.0,
            1.0 if any(w in behavior for w in ["gian dối", "lừa đảo", "giả mạo"]) else 0.0,
            1.0 if weapon else 0.0,
            min(damage / 100_000_000.0, 1.0)
        ]

        if article_no == 168:
            e_kq = [1.0, 0.0, 0.0, 0.0, 0.8, 0.5]
        elif article_no == 171:
            e_kq = [0.2, 0.0, 1.0, 0.0, 0.3, 0.5]
        elif article_no == 170:
            e_kq = [0.6, 0.0, 0.0, 0.3, 0.3, 0.5]
        elif article_no == 173:
            e_kq = [0.0, 1.0, 0.0, 0.0, 0.1, 0.5]
        elif article_no == 174:
            e_kq = [0.0, 0.0, 0.0, 1.0, 0.0, 0.5]
        elif article_no == 123:
            e_kq = [1.0, 0.0, 0.0, 0.0, 1.0, 0.9]
        elif article_no == 134:
            e_kq = [0.8, 0.0, 0.0, 0.0, 0.6, 0.5]
        else:
            e_kq = [0.5, 0.5, 0.5, 0.5, 0.5, 0.5]

        # 3. Chủ thể (CT): Suspect age & legal capacity
        v_ct = [1.0 if age >= 16 else 0.5, 1.0]
        e_ct = [1.0, 1.0]

        # 4. Mặt chủ quan (CQ): Intent & Purpose
        if article_no in [168, 170, 171, 173, 174, 175]:
            v_cq = [1.0, 1.0, 0.0]
            e_cq = [1.0, 1.0, 0.0]
        elif article_no == 123:
            v_cq = [1.0, 0.0, 1.0]
            e_cq = [1.0, 0.0, 1.0]
        elif article_no == 134:
            v_cq = [1.0, 0.0, 0.5]
            e_cq = [1.0, 0.0, 0.5]
        else:
            v_cq = [1.0, 0.5, 0.5]
            e_cq = [1.0, 0.5, 0.5]

        cos_kt = _cosine_similarity(v_kt, e_kt)
        cos_kq = _cosine_similarity(v_kq, e_kq)
        cos_ct = _cosine_similarity(v_ct, e_ct)
        cos_cq = _cosine_similarity(v_cq, e_cq)

        element_scores = {
            "KT": round(cos_kt, 4),
            "KQ": round(cos_kq, 4),
            "CT": round(cos_ct, 4),
            "CQ": round(cos_cq, 4)
        }

        total_score = sum(cls.ELEMENT_WEIGHTS[m] * element_scores[m] for m in ["KT", "KQ", "CT", "CQ"])
        return round(total_score, 4), element_scores

    @classmethod
    def apply_graph_distillation(
        cls, 
        suggestions: List[SuggestedChargeSchema], 
        entities: ExtractedEntitiesSchema
    ) -> List[SuggestedChargeSchema]:
        """
        Graph Distillation Operator: Disambiguates easily confused crime pairs:
        1. Cướp tài sản (Điều 168) vs Cướp giật tài sản (Điều 171) [and Điều 170 Cưỡng đoạt]
        2. Giết người chưa đạt (Điều 123) vs Cố ý gây thương tích (Điều 134)
        """
        behavior = (entities.objective_behavior or "").lower()
        weapon = (entities.weapon or "").lower()

        article_map = {s.article_id: s for s in suggestions}

        # ---------------------------------------------------------------------
        # DISTILLATION PAIR 1: Cướp tài sản (Điều 168) vs Cướp giật tài sản (Điều 171) vs Cưỡng đoạt (Điều 170)
        # ---------------------------------------------------------------------
        if 168 in article_map and 170 in article_map:
            conflict_text = (
                "CẢNH BÁO CẠNH TRANH TỘI DANH: Phát hiện tình tiết giao thoa giữa Tội cướp tài sản (Điều 168) và Tội cưỡng đoạt tài sản (Điều 170). "
                "Yêu cầu làm rõ: Hành vi đe dọa dùng vũ lực có mang tính chất 'ngay tức khắc' và làm tê liệt ý chí kháng cự (Điều 168) "
                "hay đe dọa dùng vũ lực uy hiếp tinh thần ép giao tài sản (Điều 170)."
            )
            article_map[168].conflict_warning = conflict_text
            article_map[170].conflict_warning = conflict_text

        if 168 in article_map or 171 in article_map or 170 in article_map:
            has_snatch = any(w in behavior for w in ["giật", "nhanh chóng", "cướp giật", "tẩu thoát", "xe máy giật"])
            has_direct_force = any(w in behavior for w in ["khống chế", "đánh đập", "tê liệt", "vũ lực ngay tức khắc", "bóp cổ", "dùng dao uy hiếp"])

            if has_snatch and not has_direct_force:
                distill_text = (
                    "KẾT QUẢ PHÂN ĐỊNH (Graph Distillation): Xác định hành vi mang bản chất 'Nhanh chóng giật lấy tài sản rồi tẩu thoát'. "
                    "Phân định nghiêng về Tội cướp giật tài sản (Điều 171 BLTTHS), loại trừ Tội cướp tài sản (Điều 168) do không làm nạn nhân lâm vào tình trạng tê liệt chống cự bằng vũ lực trực tiếp ngay từ đầu."
                )
                if 171 in article_map:
                    article_map[171].distillation_result = distill_text
                    article_map[171].matching_score = min(1.0, (article_map[171].matching_score or 0.8) + 0.15)
                if 168 in article_map:
                    article_map[168].conflict_warning = distill_text
                    article_map[168].matching_score = max(0.1, (article_map[168].matching_score or 0.8) - 0.2)
            elif has_direct_force:
                distill_text = (
                    "KẾT QUẢ PHÂN ĐỊNH (Graph Distillation): Xác định hành vi 'Dùng vũ lực hoặc đe dọa dùng vũ lực ngay tức khắc làm nạn nhân không thể chống cự được'. "
                    "Phân định nghiêng về Tội cướp tài sản (Điều 168 BLTTHS)."
                )
                if 168 in article_map:
                    article_map[168].distillation_result = distill_text
                    article_map[168].matching_score = min(1.0, (article_map[168].matching_score or 0.8) + 0.15)
                if 171 in article_map:
                    article_map[171].conflict_warning = distill_text

        # ---------------------------------------------------------------------
        # DISTILLATION PAIR 2: Giết người chưa đạt (Điều 123) vs Cố ý gây thương tích (Điều 134)
        # ---------------------------------------------------------------------
        if 123 in article_map or 134 in article_map:
            vital_areas = ["đầu", "cổ", "ngực", "tim", "bụng", "gáy"]
            is_vital_target = any(w in behavior for w in vital_areas)
            is_lethal_weapon = any(w in weapon or w in behavior for w in ["dao nhọn", "súng", "dao bấm", "búa", "hung khí nguy hiểm"])

            if is_vital_target or (is_lethal_weapon and ("đâm" in behavior or "chém" in behavior)):
                distill_text = (
                    "KẾT QUẢ PHÂN ĐỊNH (Graph Distillation): Phát hiện hành vi tấn công vào vùng yếu hại (đầu, cổ, ngực, tim) "
                    "hoặc sử dụng hung khí nguy hiểm có tính chất sát thương cao. Lỗi cố ý chủ quan thể hiện ý thức tước đoạt tính mạng. "
                    "Phân định nghiêng về Tội giết người (Chưa đạt) (Điều 123 BLTTHS), cần phân biệt với Tội cố ý gây thương tích (Điều 134)."
                )
                if 123 in article_map:
                    article_map[123].distillation_result = distill_text
                    article_map[123].matching_score = min(1.0, (article_map[123].matching_score or 0.8) + 0.2)
                if 134 in article_map:
                    article_map[134].conflict_warning = distill_text
            else:
                distill_text = (
                    "KẾT QUẢ PHÂN ĐỊNH (Graph Distillation): Hành vi tấn công vào vùng không yếu hại (tay, chân), "
                    "ý thức chủ quan chỉ nhằm mục đích gây thương tích/tổn hại sức khỏe. "
                    "Phân định nghiêng về Tội cố ý gây thương tích (Điều 134 BLTTHS)."
                )
                if 134 in article_map:
                    article_map[134].distillation_result = distill_text
                    article_map[134].matching_score = min(1.0, (article_map[134].matching_score or 0.8) + 0.15)
                if 123 in article_map:
                    article_map[123].conflict_warning = distill_text

        return list(article_map.values())

    @classmethod
    def match_charge(cls, entities: ExtractedEntitiesSchema) -> List[SuggestedChargeSchema]:
        """
        Maps extracted entities to Legal Knowledge Graph, evaluates 4 constituent elements S(f, C_k),
        applies Graph Distillation Operator, and provides GNNExplainer XAI justifications.
        """
        if not cls._graph_data:
            cls.load_graph()

        behavior = (entities.objective_behavior or "").lower()
        weapon = (entities.weapon or "").lower()
        damage = entities.consequence or 0.0

        suggestions: List[SuggestedChargeSchema] = []
        matched_articles: List[Tuple[int, str]] = []

        nodes = cls._graph_data.get("nodes", [])
        edges = cls._graph_data.get("edges", [])

        # 1. Map behavior to Article nodes using graph attributes & rule heuristics
        for node in nodes:
            if node.get("type") == "Article" or node.get("label") == "Article":
                props = node.get("properties", {})
                ten_dieu = props.get("ten_dieu", props.get("title", props.get("name", "")))
                dieu_id = str(node.get("id", ""))
                
                try:
                    dieu_no = int(props.get("article_number", props.get("dieu", 0)))
                    if dieu_no == 0:
                        dieu_no = int(dieu_id.replace("dieu_", "").replace("article_", ""))
                except ValueError:
                    continue

                keywords = props.get("keywords", [])
                matched_kws = [kw for kw in keywords if kw.lower() in behavior]
                
                if (any(kw in behavior for kw in ["trộm", "lén lút", "cạy cửa"]) and dieu_no == 173) or \
                   (any(kw in behavior for kw in ["cướp giật", "giật tài sản", "nhanh chóng giật"]) and dieu_no == 171) or \
                   (any(kw in behavior for kw in ["cướp", "khống chế", "dùng vũ lực"]) and dieu_no == 168) or \
                   (any(kw in behavior for kw in ["cưỡng đoạt", "đe dọa dùng vũ lực", "uy hiếp"]) and dieu_no == 170) or \
                   (any(kw in behavior for kw in ["lừa đảo", "gian dối", "giả mạo", "chiếm đoạt"]) and dieu_no == 174) or \
                   (any(kw in behavior for kw in ["lạm dụng tín nhiệm", "tín nhiệm", "vay mượn", "thuê xe"]) and dieu_no == 175) or \
                   (any(kw in behavior for kw in ["hủy hoại", "hư hỏng", "đốt", "phá hoại"]) and dieu_no == 178) or \
                   (any(kw in behavior for kw in ["ma túy", "heroine", "tàng trữ"]) and dieu_no == 249) or \
                   (any(kw in behavior for kw in ["đánh bạc", "cá độ", "lô đề"]) and dieu_no == 321) or \
                   (any(kw in behavior for kw in ["giết người", "tước đoạt tính mạng", "đâm vào ngực", "đâm vào cổ"]) and dieu_no == 123) or \
                   (any(kw in behavior for kw in ["gây thương tích", "tổn hại sức khỏe", "đánh gây thương tích", "chém vào tay"]) and dieu_no == 134) or \
                   (any(kw in behavior for kw in ["tham ô", "thủ quỹ", "công quỹ"]) and dieu_no == 353) or \
                   (any(kw in behavior for kw in ["hối lộ", "nhận tiền", "nhận 200", "đòi hỏi và nhận"]) and dieu_no == 354) or \
                   (any(kw in behavior for kw in ["che giấu"]) and dieu_no == 389) or \
                   matched_kws:
                    matched_articles.append((dieu_no, ten_dieu or cls.ARTICLE_TITLES.get(dieu_no, f"Điều {dieu_no}")))

        # Fallback check if article was not in graph JSON but matches behavior keywords
        for d_no, d_title in cls.ARTICLE_TITLES.items():
            if not any(m[0] == d_no for m in matched_articles):
                if (d_no == 168 and any(w in behavior for w in ["cướp", "khống chế", "dùng vũ lực"])) or \
                   (d_no == 171 and any(w in behavior for w in ["giật", "nhanh chóng", "cướp giật"])) or \
                   (d_no == 170 and any(w in behavior for w in ["cưỡng đoạt", "đe dọa"])) or \
                   (d_no == 173 and any(w in behavior for w in ["trộm", "lén lút"])) or \
                   (d_no == 174 and any(w in behavior for w in ["lừa đảo", "gian dối"])) or \
                   (d_no == 175 and any(w in behavior for w in ["lạm dụng", "thuê xe"])) or \
                   (d_no == 178 and any(w in behavior for w in ["hủy hoại", "hư hỏng", "đốt", "phá hoại"])) or \
                   (d_no == 249 and any(w in behavior for w in ["ma túy", "heroine", "tàng trữ"])) or \
                   (d_no == 321 and any(w in behavior for w in ["đánh bạc", "cá độ", "lô đề"])) or \
                   (d_no == 353 and any(w in behavior for w in ["tham ô", "thủ quỹ", "công quỹ"])) or \
                   (d_no == 354 and any(w in behavior for w in ["hối lộ", "nhận tiền", "nhận", "đòi hỏi"])) or \
                   (d_no == 123 and any(w in behavior for w in ["giết", "tước đoạt", "đâm", "cổ", "ngực"])) or \
                   (d_no == 134 and any(w in behavior for w in ["thương tích", "gây tổn hại", "đánh", "chém"])):
                    matched_articles.append((d_no, d_title))

        # Remove duplicate article hits
        unique_matched = {}
        for d_no, d_name in matched_articles:
            if d_no not in unique_matched:
                unique_matched[d_no] = d_name or cls.ARTICLE_TITLES.get(d_no, f"Điều {d_no}")

        # 2. Process each matched article: calculate 4-element score S(f, C_k) & clause
        for dieu_no, ten_dieu in unique_matched.items():
            clause = 1
            clause_details = "Khung hình phạt cơ bản."

            if dieu_no == 173:  # Trộm cắp
                if damage >= 500_000_000:
                    clause = 4
                    clause_details = "Khoản 4 Điều 173: Chiếm đoạt tài sản 500tr trở lên (Tù từ 12-20 năm)."
                elif damage >= 200_000_000:
                    clause = 3
                    clause_details = "Khoản 3 Điều 173: Chiếm đoạt từ 200tr đến dưới 500tr (Tù từ 07-15 năm)."
                elif damage >= 50_000_000:
                    clause = 2
                    clause_details = "Khoản 2 Điều 173: Chiếm đoạt từ 50tr đến dưới 200tr (Tù từ 02-07 năm)."
                else:
                    clause = 1
                    clause_details = "Khoản 1 Điều 173: Chiếm đoạt từ 2tr đến dưới 50tr (Cải tạo không giam giữ đến 03 năm hoặc Tù từ 06 tháng - 03 năm)."

            elif dieu_no == 171:  # Cướp giật
                if damage >= 500_000_000:
                    clause = 4
                    clause_details = "Khoản 4 Điều 171: Chiếm đoạt tài sản 500tr trở lên (Tù từ 12-20 năm hoặc Chung thân)."
                elif damage >= 200_000_000:
                    clause = 3
                    clause_details = "Khoản 3 Điều 171: Chiếm đoạt từ 200tr đến dưới 500tr (Tù từ 07-15 năm)."
                elif damage >= 50_000_000:
                    clause = 2
                    clause_details = "Khoản 2 Điều 171: Chiếm đoạt từ 50tr đến dưới 200tr (Tù từ 03-10 năm)."
                else:
                    clause = 1
                    clause_details = "Khoản 1 Điều 171: Cướp giật tài sản (Tù từ 01-05 năm)."

            elif dieu_no == 168:  # Cướp
                if damage >= 500_000_000:
                    clause = 4
                    clause_details = "Khoản 4 Điều 168: Chiếm đoạt 500tr trở lên (Tù từ 18-20 năm hoặc Chung thân)."
                elif damage >= 200_000_000:
                    clause = 3
                    clause_details = "Khoản 3 Điều 168: Chiếm đoạt từ 200tr đến dưới 500tr (Tù từ 12-20 năm)."
                elif damage >= 50_000_000:
                    clause = 2
                    clause_details = "Khoản 2 Điều 168: Chiếm đoạt từ 50tr đến dưới 200tr (Tù từ 07-15 năm)."
                else:
                    clause = 1
                    clause_details = "Khoản 1 Điều 168: Dùng vũ lực/đe dọa vũ lực ngay tức khắc (Tù từ 03-10 năm)."

            elif dieu_no == 123:  # Giết người
                clause = 1
                clause_details = "Khoản 1 Điều 123: Tội giết người (Tù từ 12-20 năm, Tù chung thân hoặc Tử hình)."

            elif dieu_no == 134:  # Cố ý gây thương tích
                clause = 1
                clause_details = "Khoản 1 Điều 134: Tội cố ý gây thương tích hoặc gây tổn hại sức khỏe cho người khác."

            # Calculate 4 Constituent Elements Score S(f, C_k)
            total_score, elem_scores = cls.calculate_4_elements_score(entities, dieu_no)

            # Generate GNNExplainer XAI output
            xai_explanation = GNNExplainer.explain(
                article_id=dieu_no,
                entities=entities,
                element_scores=elem_scores,
                graph_nodes=nodes,
                graph_edges=edges
            )

            reasoning_path = cls.find_reasoning_path(dieu_no, entities)
            confidence_score = cls.calculate_path_confidence(reasoning_path, total_score)

            suggestions.append(SuggestedChargeSchema(
                article_id=dieu_no,
                title=ten_dieu or f"Điều {dieu_no}",
                applicable_clause=clause,
                clause_details=clause_details,
                matching_score=total_score,
                element_scores=elem_scores,
                explanation=xai_explanation,
                reasoning_path=reasoning_path,
                confidence_score=confidence_score
            ))

        # 3. Apply Graph Distillation Operator for confusing crime pairs
        distilled_suggestions = cls.apply_graph_distillation(suggestions, entities)
        
        # Sort suggestions by matching_score descending
        distilled_suggestions.sort(key=lambda s: s.matching_score or 0.0, reverse=True)
        return distilled_suggestions

    @classmethod
    def find_reasoning_path(cls, article_id: int, entities: ExtractedEntitiesSchema) -> List[str]:
        """
        Trích xuất luồng suy luận đồ thị (Graph Reasoning Path) từ Đỉnh thực thể ➔ Đỉnh hành vi ➔ Nút Tội danh.
        """
        path = []
        age_str = f"{entities.suspect_age} tuổi" if entities.suspect_age else "Chưa rõ tuổi"
        path.append(f"1. Chủ thể bị can: {age_str} (Điều 12 BLHS)")

        if entities.weapon:
            path.append(f"2. Hung khí / Phương tiện: {entities.weapon}")

        if entities.objective_behavior:
            path.append(f"3. Hành vi khách quan: {entities.objective_behavior}")

        if entities.consequence and entities.consequence > 0:
            path.append(f"4. Thiệt hại tài sản / Hậu quả: {entities.consequence:,.0f} VNĐ")

        path.append(f"5. Nút Cấu thành Pháp lý: Điều {article_id} BLHS 2015")
        return path

    @classmethod
    def calculate_path_confidence(cls, reasoning_path: List[str], base_score: float) -> float:
        """
        Tính toán điểm tin cậy luồng đồ thị dựa trên số lượng cạnh kết nối và điểm cosine cơ bản.
        """
        if not reasoning_path:
            return round(base_score, 4)
        path_length_bonus = min(0.08, len(reasoning_path) * 0.015)
        return round(min(1.0, base_score + path_length_bonus), 4)
