from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.session import get_db
from app.core.security import get_current_user
from app.schemas.legal import LegalArticle
from app.services.legal_data import LegalDataService
from app.services.audit import AuditService
from app.models.user import User

router = APIRouter(prefix="/api/v1/laws", tags=["Laws Version 1 Search"])

@router.get("/search", response_model=List[LegalArticle])
def search_laws_v1(
    request: Request,
    behavior_keyword: Optional[str] = Query(None, description="Từ khóa hành vi để tra cứu"),
    article_id: Optional[int] = Query(None, description="Mã số điều luật cần tìm (dieu)"),
    chapter_id: Optional[str] = Query(None, description="Mã chương/mục cần tìm (chuong)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Tìm kiếm điều luật từ Bộ luật Hình sự 2015 sử dụng chỉ mục RAM O(1).
    Yêu cầu quyền truy cập (JWT token).
    Mọi hoạt động truy vấn đều được tự động ghi nhận vào Nhật ký kiểm toán (Audit Log).
    """
    client_ip = request.client.host if request.client else None
    
    # Perform search using LegalDataService RAM index
    results = LegalDataService.search(
        behavior_keyword=behavior_keyword,
        article_id=article_id,
        chapter_id=chapter_id
    )
    
    # Audit log entry for tracking
    AuditService.log(
        db=db,
        action="LEGAL_SEARCH_V1",
        resource_type="LEGAL",
        user_id=current_user.id,
        username=current_user.username,
        details={
            "behavior_keyword": behavior_keyword,
            "article_id": article_id,
            "chapter_id": chapter_id,
            "results_count": len(results)
        },
        ip_address=client_ip
    )
    
    return results
