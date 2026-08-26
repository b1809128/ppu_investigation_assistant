from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.session import get_db
from app.core.security import get_current_user
from app.schemas.legal import LegalArticle, LegalMatchRequest, LegalMatchResult
from app.services.legal import LegalService
from app.services.audit import AuditService
from app.models.user import User

router = APIRouter(prefix="/legal", tags=["Legal Search Engine"])

@router.get("/search", response_model=List[LegalArticle])
def search_penal_code(
    request: Request,
    query: Optional[str] = Query(None, description="Từ khóa tìm kiếm"),
    dieu: Optional[int] = Query(None, description="Số điều luật cần tìm"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Search Vietnamese Penal Code 2015 articles in cache.
    Audited.
    """
    client_ip = request.client.host if request.client else None
    results = LegalService.search_articles(query=query, dieu=dieu)
    
    # Audit log
    AuditService.log(
        db=db,
        action="LEGAL_SEARCH",
        resource_type="LEGAL",
        user_id=current_user.id,
        username=current_user.username,
        details={"query_keyword": query, "article_number": dieu, "results_count": len(results)},
        ip_address=client_ip
    )
    return results

@router.post("/match", response_model=List[LegalMatchResult])
def match_behavior_to_articles(
    request: Request,
    match_req: LegalMatchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Match a text behavior description against Penal Code articles to identify potential offenses.
    Audited.
    """
    client_ip = request.client.host if request.client else None
    results = LegalService.match_behavior(match_req.behavior_description)
    
    # Audit log
    AuditService.log(
        db=db,
        action="LEGAL_MATCH_BEHAVIOR",
        resource_type="LEGAL",
        user_id=current_user.id,
        username=current_user.username,
        details={
            "behavior_length": len(match_req.behavior_description),
            "matches_found": len(results),
            "top_match_dieu": results[0].article.dieu if results else None
        },
        ip_address=client_ip
    )
    return results
