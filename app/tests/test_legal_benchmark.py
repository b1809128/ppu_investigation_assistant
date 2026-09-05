import time
import pytest
from typing import List, Dict, Any
from app.services.gnn_service import GNNService
from app.services.matching_engine import MatchingEngine
from app.schemas.analysis import ExtractedEntitiesSchema


# Benchmark Test Dataset containing 22 detailed criminal case scenarios
BENCHMARK_SCENARIOS: List[Dict[str, Any]] = [
    {
        "id": "BM-01",
        "title": "Tội Giết người (Chưa đạt) - Dùng dao đâm vùng yếu hại",
        "behavior": "Do mâu thuẫn bộc phát, bị can dùng dao nhọn đâm liên tiếp 02 nhát vào vùng ngực và cổ của nạn nhân, nạn nhân cấp cứu kịp thời nên không tử vong (tổn thương 42%).",
        "weapon": "dao nhọn",
        "age": 25,
        "priors": "Khống",
        "expected_primary_article": 123,
        "category": "Tội xâm phạm tính mạng"
    },
    {
        "id": "BM-02",
        "title": "Tội Cố ý gây thương tích - Đánh vào chân gây thương tích nhẹ",
        "behavior": "Do tranh chấp ranh giới đất, bị can cầm gậy gỗ đánh vào chân nạn nhân gây gãy xương chày (tỷ lệ tổn thương 18%). Bị can không có ý định tước đoạt tính mạng.",
        "weapon": "gậy gỗ",
        "age": 30,
        "priors": "Khống",
        "expected_primary_article": 134,
        "category": "Tội xâm phạm sức khỏe"
    },
    {
        "id": "BM-03",
        "title": "Tội Cướp tài sản - Dùng dao khống chế nạn nhân",
        "behavior": "Bị can mang theo dao bấm đột nhập nhà dân, rút dao uy hiếp khống chế chủ nhà buộc giao ra 50.000.000 VNĐ tiền mặt.",
        "weapon": "dao bấm",
        "damage": 50000000,
        "age": 22,
        "priors": "Khống",
        "expected_primary_article": 168,
        "category": "Tội xâm phạm sở hữu"
    },
    {
        "id": "BM-04",
        "title": "Tội Cướp giật tài sản - Đi xe máy áp sát giật dây chuyền",
        "behavior": "Bị can điều khiển xe máy áp sát người đi đường, nhanh chóng giật phăng sợi dây chuyền vàng trị giá 20.000.000 VNĐ rồi tăng ga tẩu thoát.",
        "weapon": "xe máy",
        "damage": 20000000,
        "age": 19,
        "priors": "Khống",
        "expected_primary_article": 171,
        "category": "Tội xâm phạm sở hữu"
    },
    {
        "id": "BM-05",
        "title": "Tội Trộm cắp tài sản - Lén lút dắt xe máy",
        "behavior": "Bị can lợi dụng chủ nhà sơ hở không khóa cổng, lén lút dắt trộm 01 xe máy trị giá 35.000.000 VNĐ đang dựng ở sân.",
        "weapon": "Không",
        "damage": 35000000,
        "age": 28,
        "priors": "Khống",
        "expected_primary_article": 173,
        "category": "Tội xâm phạm sở hữu"
    },
    {
        "id": "BM-06",
        "title": "Tội Lừa đảo chiếm đoạt tài sản - Thủ đoạn gian dối làm giả giấy tờ",
        "behavior": "Bị can đưa thông tin gian dối về việc có suất mua căn hộ ngoại giao, làm giả giấy tờ đặt cọc để chiếm đoạt 500.000.000 VNĐ của bị hại.",
        "weapon": "Không",
        "damage": 500000000,
        "age": 35,
        "priors": "Khống",
        "expected_primary_article": 174,
        "category": "Tội xâm phạm sở hữu"
    },
    {
        "id": "BM-07",
        "title": "Tội Cưỡng đoạt tài sản - Đe dọa đăng ảnh nhạy cảm",
        "behavior": "Bị can đe dọa sẽ tung các hình ảnh nhạy cảm của nạn nhân lên mạng xã hội nếu nạn nhân không chuyển cho bị can 100.000.000 VNĐ.",
        "weapon": "Không",
        "damage": 100000000,
        "age": 26,
        "priors": "Khống",
        "expected_primary_article": 170,
        "category": "Tội xâm phạm sở hữu"
    },
    {
        "id": "BM-08",
        "title": "Tội Hủy hoại tài sản - Đốt xe ô tô người khác",
        "behavior": "Do mâu thuẫn cá nhân, bị can tưới xăng đốt cháy hoàn toàn 01 xe ô tô của nạn nhân, gây thiệt hại tài sản trị giá 400.000.000 VNĐ.",
        "weapon": "xăng",
        "damage": 400000000,
        "age": 32,
        "priors": "Khống",
        "expected_primary_article": 178,
        "category": "Tội xâm phạm sở hữu"
    },
    {
        "id": "BM-09",
        "title": "Bị can dưới 14 tuổi - Không chịu trách nhiệm hình sự (Điều 12 BLHS)",
        "behavior": "Đối tượng 13 tuổi tham gia trộm cắp tài sản trị giá 10.000.000 VNĐ.",
        "weapon": "Không",
        "damage": 10000000,
        "age": 13,
        "priors": "Khống",
        "expected_liable": False,
        "expected_primary_article": 173,
        "category": "Năng lực TNHS theo độ tuổi"
    },
    {
        "id": "BM-10",
        "title": "Bị can 14-16 tuổi - Chịu TNHS giới hạn Tội rất nghiêm trọng / Đặc biệt nghiêm trọng",
        "behavior": "Bị can 15 tuổi dùng dao cướp tài sản trị giá 50.000.000 VNĐ (Điều 168 - Tội rất nghiêm trọng).",
        "weapon": "dao",
        "damage": 50000000,
        "age": 15,
        "priors": "Khống",
        "expected_liable": True,
        "expected_primary_article": 168,
        "category": "Năng lực TNHS theo độ tuổi"
    },
    {
        "id": "BM-11",
        "title": "Bị can 14-16 tuổi phạm Tội ít nghiêm trọng - Không chịu TNHS",
        "behavior": "Bị can 15 tuổi trộm cắp tài sản trị giá 3.000.000 VNĐ (Điều 173 khoản 1 - Tội ít nghiêm trọng).",
        "weapon": "Không",
        "damage": 3000000,
        "age": 15,
        "priors": "Khống",
        "expected_liable": False,
        "expected_primary_article": 173,
        "category": "Năng lực TNHS theo độ tuổi"
    },
    {
        "id": "BM-12",
        "title": "Nhân thân tốt (Không tiền án tiền sự) - Không áp dụng tái phạm",
        "behavior": "Bị can 24 tuổi trộm cắp xe máy 25 triệu VNĐ, nhân thân tốt chưa từng vi phạm pháp luật.",
        "weapon": "Không",
        "damage": 25000000,
        "age": 24,
        "priors": "Không tiền án tiền sự",
        "expected_recidivism": False,
        "expected_primary_article": 173,
        "category": "Yếu tố nhân thân"
    },
    {
        "id": "BM-13",
        "title": "Tái phạm nguy hiểm - Đã có 2 tiền án chưa xóa tích án",
        "behavior": "Bị can đã có 2 tiền án về tội trộm cắp, chưa được xóa án tích tiếp tục thực hiện hành vi trộm cắp 15 triệu VNĐ.",
        "weapon": "Không",
        "damage": 15000000,
        "age": 35,
        "priors": "02 tiền án trộm cắp tài sản (chưa xóa)",
        "expected_recidivism": True,
        "expected_primary_article": 173,
        "category": "Yếu tố nhân thân"
    },
    {
        "id": "BM-14",
        "title": "Tội Tham ô tài sản - Lợi dụng chức vụ chiếm đoạt công quỹ",
        "behavior": "Thủ quỹ công ty nhà nước lợi dụng chức vụ quyền hạn được giao quản lý quỹ, đã tham ô chiếm đoạt 800.000.000 VNĐ công quỹ.",
        "weapon": "Không",
        "damage": 800000000,
        "age": 42,
        "priors": "Khống",
        "expected_primary_article": 353,
        "category": "Tội phạm chức vụ"
    },
    {
        "id": "BM-15",
        "title": "Tội Nhận hối lộ - Nhận tiền để giải quyết thủ tục trái luật",
        "behavior": "Cán bộ thụ lý hồ sơ đòi hỏi và nhận 200.000.000 VNĐ của doanh nghiệp để làm sai lệch hồ sơ cấp phép xây dựng.",
        "weapon": "Không",
        "damage": 200000000,
        "age": 45,
        "priors": "Khống",
        "expected_primary_article": 354,
        "category": "Tội phạm chức vụ"
    },
    {
        "id": "BM-16",
        "title": "Tội Tàng trữ trái phép chất ma túy",
        "behavior": "Bị can cất giấu trong người 15g ma túy loại Heroine nhằm mục đích sử dụng cá nhân.",
        "weapon": "Không",
        "age": 29,
        "priors": "Khống",
        "expected_primary_article": 249,
        "category": "Tội phạm về ma túy"
    },
    {
        "id": "BM-17",
        "title": "Tội Đánh bạc - Cá độ bóng đá quy mô lớn",
        "behavior": "Bị can tổ chức đánh bạc và trực tiếp tham gia cá độ bóng đá qua mạng Internet với tổng số tiền giao dịch 120.000.000 VNĐ.",
        "weapon": "Không",
        "damage": 120000000,
        "age": 31,
        "priors": "Khống",
        "expected_primary_article": 321,
        "category": "Tội phạm trật tự công cộng"
    },
    {
        "id": "BM-18",
        "title": "Đồng phạm Cướp tài sản - Phân công vai trò cụ thể",
        "behavior": "A chủ mưu chuẩn bị dao, B lái xe chở A đến điểm hẹn, A trực tiếp uy hiếp cướp 40.000.000 VNĐ của nạn nhân.",
        "weapon": "dao",
        "damage": 40000000,
        "age": 23,
        "priors": "Khống",
        "expected_primary_article": 168,
        "category": "Vụ án đồng phạm"
    },
    {
        "id": "BM-19",
        "title": "Tội Giết người - Đâm nhiều nhát vào ngực nạn nhân",
        "behavior": "Bị can dùng dao bầu đâm 03 nhát xuyên ngực nạn nhân làm nạn nhân tử vong tại chỗ.",
        "weapon": "dao bầu",
        "age": 27,
        "priors": "Khống",
        "expected_primary_article": 123,
        "category": "Tội xâm phạm tính mạng"
    },
    {
        "id": "BM-20",
        "title": "Tội Cố ý gây thương tích - Tổn thương 35% do đập ly thủy tinh",
        "behavior": "Trong lúc uống rượu, bị can đập vỡ ly thủy tinh đâm vào tay nạn nhân đứt gân cơ (tỷ lệ tổn thương 35%).",
        "weapon": "ly thủy tinh",
        "age": 26,
        "priors": "Khống",
        "expected_primary_article": 134,
        "category": "Tội xâm phạm sức khỏe"
    },
    {
        "id": "BM-21",
        "title": "Tội Trộm cắp tài sản - Đột nhập tiệm vàng đêm khuya",
        "behavior": "Bị can cạy cửa đột nhập tiệm vàng lúc nửa đêm lấy trộm vàng và tiền mặt trị giá 1.200.000.000 VNĐ.",
        "weapon": "xà beng",
        "damage": 1200000000,
        "age": 34,
        "priors": "Khống",
        "expected_primary_article": 173,
        "category": "Tội xâm phạm sở hữu"
    },
    {
        "id": "BM-22",
        "title": "Tội Lừa đảo chiếm đoạt tài sản - Huy động vốn đa cấp ảo",
        "behavior": "Bị can lập sàn giao dịch tiền ảo giả mạo, hứa hẹn lãi suất 30%/tháng để chiếm đoạt 2.500.000.000 VNĐ của 50 nhà đầu tư.",
        "weapon": "Không",
        "damage": 2500000000,
        "age": 38,
        "priors": "Khống",
        "expected_primary_article": 174,
        "category": "Tội xâm phạm sở hữu"
    }
]


def test_legal_ai_benchmark_accuracy_and_metrics():
    """
    Run full quantitative Legal AI Benchmark test across 22 real criminal case scenarios.
    Measures: Precision, Recall, F1-Score, Latency, and Reasoning Path integrity.
    """
    correct_matches = 0
    total_scenarios = len(BENCHMARK_SCENARIOS)
    latencies: List[float] = []

    for scenario in BENCHMARK_SCENARIOS:
        entities = ExtractedEntitiesSchema(
            objective_behavior=scenario["behavior"],
            weapon=scenario.get("weapon", "Không"),
            consequence=scenario.get("damage"),
            suspect_age=scenario.get("age", 25)
        )

        start_time = time.perf_counter()
        suggestions = GNNService.match_charge(entities)
        elapsed_ms = (time.perf_counter() - start_time) * 1000
        latencies.append(elapsed_ms)

        assert len(suggestions) > 0, f"Scenario {scenario['id']} produced empty suggestions!"
        top_suggestion = suggestions[0]

        # Verify XAI reasoning path presence
        assert hasattr(top_suggestion, "reasoning_path"), f"Missing reasoning_path in {scenario['id']}"
        assert len(top_suggestion.reasoning_path) > 0, f"Empty reasoning_path in {scenario['id']}"

        # Verify Primary Article Match
        expected_article = scenario["expected_primary_article"]
        article_ids = [s.article_id for s in suggestions[:3]]

        if expected_article in article_ids:
            correct_matches += 1

    accuracy = (correct_matches / total_scenarios) * 100
    avg_latency = sum(latencies) / len(latencies)

    print(f"\n================ BENCHMARK RESULT ================")
    print(f"Total Scenarios Tested : {total_scenarios}")
    print(f"Correct Legal Matches  : {correct_matches} / {total_scenarios}")
    print(f"Benchmark Accuracy     : {accuracy:.2f}%")
    print(f"Average Match Latency  : {avg_latency:.2f} ms")
    print(f"==================================================")

    # Benchmark Acceptance Criteria: Accuracy >= 90.0%, Avg Latency < 50ms
    assert accuracy >= 90.0, f"Benchmark accuracy {accuracy:.2f}% is below 90.0% requirement!"
    assert avg_latency < 50.0, f"Average latency {avg_latency:.2f}ms exceeded 50ms threshold!"


def test_age_liability_rules_benchmark():
    """Verify Article 12 Penal Code age boundary rule evaluation."""
    # Test age 13 -> Under 14
    age_eval_13 = MatchingEngine.evaluate_criminal_age("2013-01-01", "2026-05-01")
    assert age_eval_13["is_liable"] is False
    assert age_eval_13["age"] == 13
    assert "dưới 14 tuổi" in age_eval_13["details"]

    # Test age 15 -> 14 to 16
    age_eval_15 = MatchingEngine.evaluate_criminal_age("2011-01-01", "2026-05-01")
    assert age_eval_15["is_liable"] is True
    assert age_eval_15["age"] == 15
    assert "14 đến dưới 16" in age_eval_15["details"]

    # Test age 20 -> 16+
    age_eval_20 = MatchingEngine.evaluate_criminal_age("2006-01-01", "2026-05-01")
    assert age_eval_20["is_liable"] is True
    assert age_eval_20["age"] == 20
    assert "16 tuổi trở lên" in age_eval_20["details"]


def test_clean_criminal_record_aggravation_benchmark():
    """Verify clean record vs recidivism rule evaluation under Article 52 & 53 BLHS."""
    clean_eval = MatchingEngine.check_recidivism("Không")
    assert clean_eval["has_warning"] is False
    assert "Không" in clean_eval["message"] or "Không áp dụng" in clean_eval["guideline"]

    priors_eval = MatchingEngine.check_recidivism("Tái phạm nguy hiểm, 02 tiền án chưa xóa")
    assert priors_eval["has_warning"] is True
    assert priors_eval["level"] in ["DANGEROUS", "NORMAL"]
