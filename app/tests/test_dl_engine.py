import unittest
from unittest.mock import MagicMock
from app.schemas.graph import CaseGraphSchema, NodeSchema, EdgeSchema
from app.services.dl_engine import DeepLearningEngine
from app.services.matching_engine import MatchingEngine
from app.models.case import CaseFile, CaseDocument, InvestigationLog
from app.models.suspect import Suspect
from app.models.user import User

class TestDeepLearningEngine(unittest.TestCase):
    def test_case_graph_schema(self):
        """Xác minh Schema đồ thị vụ án (CaseGraphSchema) parse dữ liệu đúng cấu trúc"""
        nodes = [
            NodeSchema(id="suspect_1", label="Suspect", properties={"name": "Nguyễn Văn A", "age": 25}),
            NodeSchema(id="action_1", label="Action", properties={"type": "Lén lút lấy tài sản"}),
            NodeSchema(id="asset_1", label="Asset", properties={"type": "Xe máy", "value": 15000000})
        ]
        edges = [
            EdgeSchema(source="suspect_1", target="action_1", relation="THỰC_HIỆN"),
            EdgeSchema(source="action_1", target="asset_1", relation="CHIẾM_ĐOẠT")
        ]
        
        graph = CaseGraphSchema(nodes=nodes, edges=edges)
        
        self.assertEqual(len(graph.nodes), 3)
        self.assertEqual(len(graph.edges), 2)
        self.assertEqual(graph.nodes[0].properties["name"], "Nguyễn Văn A")
        self.assertEqual(graph.edges[1].relation, "CHIẾM_ĐOẠT")

    def test_dl_engine_predictions(self):
        """Kiểm tra kết quả phân loại hành vi và định tội danh của DeepLearningEngine"""
        engine = DeepLearningEngine()
        
        # Test trộm cắp
        res_trom = engine.predict_charges("Đối tượng đột nhập cạy cửa lấy trộm xe máy điện")
        self.assertTrue(any(r["article_id"] == 173 for r in res_trom))
        self.assertTrue(all(r["confidence"] > 0.0 for r in res_trom))
        self.assertIn("xai_path", res_trom[0])
        
        # Test lừa đảo
        res_lua = engine.predict_charges("Đối tượng giả mạo cán bộ chuyển tiền ngân hàng lừa đảo")
        self.assertTrue(any(r["article_id"] == 174 for r in res_lua))
        
        # Test tham ô
        res_tham = engine.predict_charges("Thủ quỹ có hành vi tham ô lợi dụng chức vụ chiếm đoạt công quỹ")
        self.assertTrue(any(r["article_id"] == 353 for r in res_tham))

    def test_matching_engine_integration(self):
        """Xác minh MatchingEngine tích hợp kết quả từ DLEngine và bổ sung thông tin ai_evaluation"""
        db_mock = MagicMock()
        
        # Mock CaseFile
        case = CaseFile(
            id=999,
            case_code="TEST-001",
            case_name="Vụ án trộm cắp thử nghiệm",
            summary_acts="Bị can cạy cửa đột nhập lấy trộm tài sản trị giá 20 triệu đồng",
            incident_date="2026-08-30",
            location="Hà Nội",
            damage_value=20000000.0,
            documents=[]
        )
        
        # Mock Suspect
        suspect = Suspect(
            id=123,
            case_id=999,
            full_name="Trần Văn B",
            dob="2000-01-01",
            prior_convictions="Không"
        )
        
        db_mock.query().filter().first.return_value = case
        db_mock.query().filter().all.return_value = [suspect]
        
        # Mock LegalDataService raw articles
        from app.services.legal_data import LegalDataService
        LegalDataService._raw_articles = [
            {
                "dieu": 173,
                "ten_dieu": "Tội trộm cắp tài sản",
                "keywords": ["trộm", "lấy trộm"],
                "noi_dung": "...",
                "chuong": "..."
            }
        ]
        
        result = MatchingEngine.evaluate_case(db_mock, 999)
        
        # Kiểm tra kết quả trả về
        self.assertIn("evaluations", result)
        evals = result["evaluations"]
        self.assertEqual(len(evals), 1)
        
        suggestions = evals[0]["article_suggestions"]
        self.assertTrue(len(suggestions) > 0)
        self.assertEqual(suggestions[0]["article_id"], 173)
        
        # Xác minh thông tin ai_evaluation được nhúng thành công
        ai_eval = suggestions[0]["ai_evaluation"]
        self.assertIsNotNone(ai_eval)
        self.assertEqual(ai_eval["engine"], "Hybrid (TextCNN + GNN)")
        self.assertTrue(ai_eval["confidence"] > 0.8)
        self.assertIn("nodes", ai_eval["xai_path"])

    def test_safe_match_keyword(self):
        """Kiểm tra bộ lọc từ khóa ngắn và ranh giới từ tiếng Việt"""
        # Từ khóa ngắn (< 4 ký tự) phải bị loại bỏ
        self.assertFalse(MatchingEngine.safe_match_keyword("đá", "đối tượng sử dụng ma túy đá"))
        self.assertFalse(MatchingEngine.safe_match_keyword("kẹo", "thu giữ 5 viên kẹo"))
        
        # Từ khóa có độ dài >= 4 và trùng khớp ranh giới từ
        self.assertTrue(MatchingEngine.safe_match_keyword("ma túy", "tàng trữ trái phép chất ma túy"))
        
        # Khớp chuỗi con nhưng không phải từ độc lập (ranh giới từ hoạt động đúng)
        # "cướp" không được phép khớp khi là một phần của từ không có khoảng trắng như "cướpđoạt"
        self.assertFalse(MatchingEngine.safe_match_keyword("cướp", "hành vi cướpđoạt tài sản"))
        self.assertTrue(MatchingEngine.safe_match_keyword("cướp", "hành vi cướp đoạt tài sản"))

    def test_check_recidivism_scenarios(self):
        """Xác minh logic phân loại tái phạm hình sự chính xác"""
        # 1. Đã xóa án tích -> NONE
        res_expunged = MatchingEngine.check_recidivism("Đã bị kết án năm 2018 nhưng đã được xóa án tích")
        self.assertEqual(res_expunged["level"], "NONE")
        self.assertIn("Đã được xóa án tích", res_expunged["message"])
        
        # 2. Chỉ có tiền sự -> NONE
        res_tiensu = MatchingEngine.check_recidivism("Có 1 tiền sự về hành vi gây rối trật tự công cộng")
        self.assertEqual(res_tiensu["level"], "NONE")
        self.assertIn("Chỉ có tiền sự", res_tiensu["message"])
        
        # 3. Tiền án chưa xóa -> NORMAL
        res_normal = MatchingEngine.check_recidivism("Có 1 tiền án chưa được xóa án tích")
        self.assertEqual(res_normal["level"], "NORMAL")
        
        # 4. Tái phạm nguy hiểm -> DANGEROUS
        res_dangerous = MatchingEngine.check_recidivism("Tái phạm nguy hiểm")
        self.assertEqual(res_dangerous["level"], "DANGEROUS")

    def test_matching_engine_manual_keywords(self):
        """Xác minh MatchingEngine hỗ trợ tham số manual_keywords ghi đè tóm tắt vụ việc"""
        db_mock = MagicMock()
        
        case = CaseFile(
            id=999,
            case_code="TEST-002",
            case_name="Vụ án trộm cắp",
            summary_acts="Tên trộm lấy xe máy", # Sẽ bị ghi đè bởi manual_keywords
            incident_date="2026-08-30",
            location="Hà Nội",
            damage_value=20000000.0,
            documents=[]
        )
        suspect = Suspect(
            id=123,
            case_id=999,
            full_name="Trần Văn B",
            dob="2000-01-01",
            prior_convictions="Không"
        )
        
        db_mock.query().filter().first.return_value = case
        db_mock.query().filter().all.return_value = [suspect]
        
        from app.services.legal_data import LegalDataService
        LegalDataService._raw_articles = [
            {
                "dieu": 173,
                "ten_dieu": "Tội trộm cắp tài sản",
                "keywords": ["trộm", "lấy trộm"],
                "noi_dung": "...",
                "chuong": "..."
            },
            {
                "dieu": 174,
                "ten_dieu": "Tội lừa đảo chiếm đoạt tài sản",
                "keywords": ["lừa đảo", "gian dối"],
                "noi_dung": "...",
                "chuong": "..."
            }
        ]
        
        # Chạy đối chiếu với từ khóa ghi đè "lừa đảo gian dối"
        result = MatchingEngine.evaluate_case(db_mock, 999, manual_keywords="Bị hại bị lừa đảo gian dối chiếm đoạt tiền")
        
        # Chỉ khớp tội lừa đảo (Điều 174), không khớp tội trộm cắp (Điều 173)
        suggestions = result["evaluations"][0]["article_suggestions"]
        self.assertTrue(any(s["article_id"] == 174 for s in suggestions))
        self.assertFalse(any(s["article_id"] == 173 for s in suggestions))

if __name__ == "__main__":
    unittest.main()
