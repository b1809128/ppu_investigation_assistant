import unittest
from unittest.mock import MagicMock
from datetime import date, timedelta

from app.models.user import User
from app.models.case import CaseFile, CaseDocument, InvestigationLog, CaseAnalysis
from app.models.suspect import Suspect
from app.schemas.analysis import ExtractedEntitiesSchema, SuggestedChargeSchema
from app.services.local_llm import LocalLLMService
from app.services.gnn_service import GNNService
from app.services.procedural_service import ProceduralService

class TestDeepAnalysisPipeline(unittest.TestCase):
    def test_regex_extraction_parsing(self):
        """Kiểm tra trích xuất thực thể bằng biểu thức chính quy (Regex fallback)"""
        # Test case 1: Trộm cắp có số tiền và ngày bắt
        text_1 = "Trần Văn A (22 tuổi) bị bắt ngày 10/08/2026 vì hành vi cạy cửa lẻn vào nhà lấy trộm tài sản trị giá 45 triệu đồng."
        entities = LocalLLMService._regex_extract(text_1)
        self.assertEqual(entities.suspect_age, 22)
        self.assertEqual(entities.consequence, 45_000_000.0)
        self.assertEqual(entities.arrest_time, "2026-08-10")
        self.assertIn("trộm cắp", entities.objective_behavior)

        # Test case 2: Cướp tài sản có hung khí và ngày bắt ISO
        text_2 = "Bị can sinh năm 2000 khống chế nạn nhân bằng dao lúc bị bắt ngày 2026-08-25 nhằm cướp tài sản trị giá 5.000.000 vnđ."
        entities_2 = LocalLLMService._regex_extract(text_2)
        self.assertEqual(entities_2.suspect_age, 26)  # 2026 - 2000 = 26
        self.assertEqual(entities_2.consequence, 5_000_000.0)
        self.assertEqual(entities_2.arrest_time, "2026-08-25")
        self.assertEqual(entities_2.weapon, "dao")
        self.assertIn("cướp", entities_2.objective_behavior)

    def test_gnn_charge_competition_detection(self):
        """Kiểm tra định tội danh GNN và phát hiện cạnh tranh tội danh cướp/cưỡng đoạt"""
        # Load mock graph data locally for testing
        GNNService._graph_data = {
            "nodes": [
                {"id": "dieu_168", "type": "Article", "properties": {"ten_dieu": "Tội cướp tài sản", "keywords": ["cướp", "khống chế"]}},
                {"id": "dieu_170", "type": "Article", "properties": {"ten_dieu": "Tội cưỡng đoạt tài sản", "keywords": ["cưỡng đoạt", "đe dọa"]}}
            ],
            "edges": []
        }
        
        entities = ExtractedEntitiesSchema(
            suspect_age=25,
            objective_behavior="đối tượng khống chế bằng vũ lực và đe dọa cưỡng đoạt tài sản",
            consequence=10_000_000.0
        )
        
        suggestions = GNNService.match_charge(entities)
        
        # Verify both Điều 168 and Điều 170 are suggested
        article_ids = [s.article_id for s in suggestions]
        self.assertIn(168, article_ids)
        self.assertIn(170, article_ids)
        
        # Verify competition warning is triggered
        self.assertTrue(any(s.conflict_warning is not None for s in suggestions))

    def test_procedural_timeline_supervision(self):
        """Kiểm tra tính toán thời hạn tố tụng và phát hiện vi phạm Điều 118 BLTTHS"""
        case = CaseFile(
            id=1,
            case_code="CASE-001",
            case_name="Vụ án trộm cắp",
            documents=[]
        )
        
        # Scenario 1: Đã tạm giữ 5 ngày nhưng không có quyết định gia hạn -> Cảnh báo khẩn cấp (CRITICAL)
        five_days_ago = (date.today() - timedelta(days=5)).strftime("%Y-%m-%d")
        entities = ExtractedEntitiesSchema(
            arrest_time=five_days_ago
        )
        suggested_charges = [
            SuggestedChargeSchema(
                article_id=173,
                title="Tội trộm cắp tài sản",
                applicable_clause=1,
                clause_details="Khoản 1"
            )
        ]
        
        warnings = ProceduralService.analyze_timeline(case, entities, suggested_charges)
        self.assertTrue(any(w.severity == "CRITICAL" and "Điều 118" in w.article_reference for w in warnings))

        # Scenario 2: Đã tạm giữ 5 ngày và có quyết định gia hạn tạm giữ lần 1 -> Cảnh báo mức độ thấp hơn (WARNING)
        doc = CaseDocument(
            name="Quyết định gia hạn tạm giữ lần 1",
            document_type="Quyết định gia hạn tạm giữ"
        )
        case.documents.append(doc)
        
        warnings_with_extension = ProceduralService.analyze_timeline(case, entities, suggested_charges)
        # Should not raise CRITICAL warning for initial 3-day limit since extension is present
        self.assertFalse(any(w.severity == "CRITICAL" and "quá thời hạn tạm giữ ban đầu 03 ngày" in w.message for w in warnings_with_extension))

if __name__ == "__main__":
    unittest.main()
