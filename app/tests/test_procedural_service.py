import pytest
from datetime import date, datetime
from app.services.procedural_service import (
    check_detention_timeline,
    check_custody_limit,
    ProceduralService
)
from app.schemas.procedural import ProceduralCheckResult


def test_check_detention_timeline_normal():
    # Tạm giữ 1 ngày, trong hạn ban đầu 3 ngày
    res = check_detention_timeline(
        arrest_date="2026-09-01",
        extensions_count=0,
        vks_approval=False,
        current_date="2026-09-02"
    )
    assert isinstance(res, ProceduralCheckResult)
    assert res.status == "NORMAL"
    assert res.days_remaining == 2
    assert res.days_elapsed == 1
    assert res.max_days == 3


def test_check_detention_timeline_warning():
    # Tạm giữ 2 ngày, còn 1 ngày hết hạn ban đầu
    res = check_detention_timeline(
        arrest_date="2026-09-01",
        extensions_count=0,
        vks_approval=False,
        current_date="2026-09-03"
    )
    assert res.status == "WARNING"
    assert res.days_remaining == 1


def test_check_detention_timeline_critical_no_vks_approval():
    # Bắt buộc cảnh báo CRITICAL nếu quá 3 ngày mà không có Phê chuẩn VKS
    res = check_detention_timeline(
        arrest_date="2026-09-01",
        extensions_count=0,
        vks_approval=False,
        current_date="2026-09-05"  # 4 ngày trôi qua
    )
    assert res.status == "CRITICAL"
    assert "CHƯA CÓ PHÊ CHUẨN VKS" in res.recommendation
    assert res.days_elapsed == 4


def test_check_detention_timeline_extension_1_with_vks():
    # Quá 3 ngày nhưng có Phê chuẩn VKS và Gia hạn lần 1 (+3 ngày -> max 6 ngày)
    res = check_detention_timeline(
        arrest_date="2026-09-01",
        extensions_count=1,
        vks_approval=True,
        current_date="2026-09-05"  # 4 ngày trôi qua
    )
    assert res.status == "NORMAL"
    assert res.max_days == 6
    assert res.days_remaining == 2


def test_check_detention_timeline_max_limit_exceeded():
    # Quá tổng thời hạn 9 ngày
    res = check_detention_timeline(
        arrest_date="2026-09-01",
        extensions_count=2,
        vks_approval=True,
        current_date="2026-09-12"  # 11 ngày trôi qua
    )
    assert res.status == "CRITICAL"
    assert res.days_remaining < 0


def test_check_custody_limit_it_nghiem_trong():
    # Tội ít nghiêm trọng: tối đa 2 tháng (60 ngày)
    res = check_custody_limit(
        crime_severity="ÍT_NGHIÊM_TRỌNG",
        custody_start_date="2026-09-01",
        current_date="2026-09-21"  # 20 ngày
    )
    assert res.status == "NORMAL"
    assert res.max_days == 60
    assert res.days_remaining == 40


def test_check_custody_limit_nghiem_trong_warning():
    # Tội nghiêm trọng: tối đa 3 tháng (90 ngày)
    res = check_custody_limit(
        crime_severity="NGHIÊM_TRỌNG",
        custody_start_date="2026-09-01",
        current_date="2026-11-20"  # 80 ngày
    )
    assert res.status == "WARNING"
    assert res.max_days == 90
    assert res.days_remaining == 10


def test_check_custody_limit_rat_nghiem_trong_critical():
    # Tội rất nghiêm trọng: tối đa 4 tháng (120 ngày) -> 130 ngày là CRITICAL
    res = check_custody_limit(
        crime_severity="RẤT_NGHIÊM_TRỌNG",
        custody_start_date="2026-09-01",
        current_date="2027-01-10"  # 131 ngày
    )
    assert res.status == "CRITICAL"
    assert res.days_remaining < 0
    assert res.max_days == 120


def test_check_custody_limit_dac_biet_nghiem_trong():
    # Tội đặc biệt nghiêm trọng: tối đa 4 tháng ban đầu (120 ngày)
    res = check_custody_limit(
        crime_severity="ĐẶC_BIỆT_NGHIÊM_TRỌNG",
        custody_start_date="2026-09-01",
        current_date="2026-10-01"  # 30 ngày
    )
    assert res.status == "NORMAL"
    assert res.max_days == 120
    assert res.days_remaining == 90


def test_procedural_service_class_wrapper():
    # Test ProceduralService wrapper static methods
    res1 = ProceduralService.check_detention_timeline(
        arrest_date="2026-09-01",
        extensions_count=0,
        vks_approval=False,
        current_date="2026-09-02"
    )
    assert res1.status == "NORMAL"

    res2 = ProceduralService.check_custody_limit(
        crime_severity="ÍT_NGHIÊM_TRỌNG",
        custody_start_date="2026-09-01",
        current_date="2026-09-21"
    )
    assert res2.status == "NORMAL"
