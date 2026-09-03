import pytest
from app.services.gnn_service import GNNService, GNNExplainer
from app.schemas.analysis import ExtractedEntitiesSchema, SuggestedChargeSchema


def test_load_graph_data():
    """Verify loading of legal_knowledge_graph.json into memory."""
    GNNService.load_graph()
    assert isinstance(GNNService._graph_data, dict)
    assert "nodes" in GNNService._graph_data
    assert len(GNNService._graph_data["nodes"]) > 0


def test_calculate_4_elements_matching_score():
    """Verify formula calculation of 4 Constituent Elements S(f, C_k)."""
    entities = ExtractedEntitiesSchema(
        objective_behavior="bị can dùng dao nhọn khống chế nạn nhân để cướp tài sản",
        weapon="dao nhọn",
        consequence=60_000_000.0,
        suspect_age=25
    )
    
    score, elem_scores = GNNService.calculate_4_elements_score(entities, article_no=168)
    
    assert isinstance(score, float)
    assert 0.0 <= score <= 1.0
    assert "KT" in elem_scores
    assert "KQ" in elem_scores
    assert "CT" in elem_scores
    assert "CQ" in elem_scores
    assert elem_scores["KQ"] > 0.5


def test_graph_distillation_robbery_vs_snatching():
    """Verify Graph Distillation Operator for Cướp (168) vs Cướp giật (171)."""
    # Scenario A: Nhanh chóng giật tài sản rồi tẩu thoát -> Distill towards Điều 171
    entities_snatch = ExtractedEntitiesSchema(
        objective_behavior="bị can đi xe máy áp sát nhanh chóng giật dây chuyền của nạn nhân rồi tẩu thoát",
        consequence=15_000_000.0
    )
    suggestions_a = GNNService.match_charge(entities_snatch)
    article_ids_a = [s.article_id for s in suggestions_a]
    assert 171 in article_ids_a
    
    # Verify 171 receives distillation classification
    s_171 = next(s for s in suggestions_a if s.article_id == 171)
    assert s_171.distillation_result is not None
    assert "cướp giật" in s_171.distillation_result.lower()


def test_graph_distillation_attempted_murder_vs_injury():
    """Verify Graph Distillation Operator for Giết người chưa đạt (123) vs Cố ý gây thương tích (134)."""
    # Scenario B: Đâm vào vùng yếu hại (đầu, cổ, ngực) bằng dao nhọn -> Distill towards Điều 123
    entities_murder = ExtractedEntitiesSchema(
        objective_behavior="bị can dùng dao nhọn đâm liên tiếp vào vùng ngực và cổ của nạn nhân",
        weapon="dao nhọn"
    )
    suggestions_b = GNNService.match_charge(entities_murder)
    article_ids_b = [s.article_id for s in suggestions_b]
    assert 123 in article_ids_b
    
    s_123 = next(s for s in suggestions_b if s.article_id == 123)
    assert s_123.distillation_result is not None
    assert "giết người" in s_123.distillation_result.lower()


def test_gnn_explainer_xai_evidence_extraction():
    """Verify GNNExplainer key evidence nodes/edges and XAI summary."""
    entities = ExtractedEntitiesSchema(
        objective_behavior="dùng súng khống chế thủ quỹ cướp tài sản",
        weapon="súng",
        consequence=500_000_000.0
    )
    
    suggestions = GNNService.match_charge(entities)
    assert len(suggestions) > 0
    
    top_suggestion = suggestions[0]
    assert top_suggestion.explanation is not None
    exp = top_suggestion.explanation
    
    assert "important_nodes" in exp
    assert "important_edges" in exp
    assert "xai_summary" in exp
    assert len(exp["important_nodes"]) > 0
    assert "GNNExplainer" in exp["xai_summary"]
