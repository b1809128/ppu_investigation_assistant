from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional

from app.db.session import get_db
from app.core.security import get_current_user
from app.services.matching_engine import MatchingEngine
from app.core.audit_decorator import audit_log
from app.models.user import User

router = APIRouter(prefix="/api/v1/cases", tags=["Case Evaluation Engine"])

@router.get("/{case_id}/evaluate", response_model=Dict[str, Any])
@audit_log(action="EVALUATE_CASE", resource_type="CASE_FILE")
def evaluate_case_by_id(
    case_id: int,
    request: Request,
    manual_keywords: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Chạy bộ phân tích đối chiếu luật hình sự cho hồ sơ vụ án:
    - Tính tuổi chịu TNHS của bị can tại thời điểm xảy ra vụ việc (Điều 12 BLHS).
    - Phân tích và định khung điều khoản dựa trên giá trị thiệt hại tài sản.
    - Phát hiện tình tiết tái phạm / tái phạm nguy hiểm (Điều 53 BLHS).
    Tự động ghi nhật ký Audit Log.
    """
    return MatchingEngine.evaluate_case(db=db, case_id=case_id, manual_keywords=manual_keywords)
