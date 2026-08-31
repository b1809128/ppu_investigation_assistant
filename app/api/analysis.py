from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.orm import Session
import json

from app.db.session import get_db
from app.core.security import get_current_user
from app.core.audit_decorator import audit_log
from app.models.user import User
from app.models.case import CaseFile, CaseAnalysis
from app.schemas.analysis import CaseAnalysisRequest, CaseAnalysisResponse
from app.services.local_llm import LocalLLMService
from app.services.gnn_service import GNNService
from app.services.procedural_service import ProceduralService

router = APIRouter(prefix="/api/v1/cases", tags=["Case Deep Analysis Pipeline"])

@router.post("/analyze", response_model=CaseAnalysisResponse)
@audit_log(action="ANALYZE_CASE", resource_type="CASE_FILE")
async def analyze_case_file(
    payload: CaseAnalysisRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Chạy đường ống xử lý học sâu (Deep Learning Pipeline) 3 giai đoạn:
    1. Trích xuất thực thể (LLM/NLP).
    2. Định tội danh (GNN/Ontology) và phát hiện cạnh tranh tội danh.
    3. Giám sát thời hạn tố tụng (Quy trình Điều 118/119).
    Lưu kết quả phân tích vào cơ sở dữ liệu và tự động ghi nhật ký kiểm toán.
    """
    case = db.query(CaseFile).filter(CaseFile.id == payload.case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Không tìm thấy hồ sơ vụ án.")

    # 1. Stage 1: Entity Extraction using Local LLM or Fallback Regex
    entities = await LocalLLMService.extract_entities(payload.summary_acts)

    # 2. Stage 2: Charge suggestions via GNN Knowledge Graph mapping and conflict checking
    suggested_charges = GNNService.match_charge(entities)

    # 3. Stage 3: Procedural Supervision Timeline checks
    procedural_warnings = ProceduralService.analyze_timeline(case, entities, suggested_charges)

    # Construct legal basis text
    legal_basis_text = (
        f"Căn cứ vào hành vi khách quan bóc tách được ({entities.objective_behavior or 'Chưa rõ'}), "
        f"thiệt hại tài sản tương ứng ({entities.consequence or 0.0:,.0f} VNĐ) đối chiếu với các quy định "
        "cấu thành tội phạm của Bộ luật Hình sự 2015."
    )

    # Save analysis results to database
    analysis_record = CaseAnalysis(
        case_id=case.id,
        summary_acts=payload.summary_acts,
        extracted_entities=json.dumps(entities.model_dump(), ensure_ascii=False),
        suggested_charge=json.dumps([c.model_dump() for c in suggested_charges], ensure_ascii=False),
        procedural_warnings=json.dumps([w.model_dump() for w in procedural_warnings], ensure_ascii=False)
    )
    db.add(analysis_record)
    db.commit()
    db.refresh(analysis_record)

    return CaseAnalysisResponse(
        case_id=case.id,
        extracted_entities=entities,
        tội_danh_đề_xuất=suggested_charges,
        căn_cứ_hình_sự=legal_basis_text,
        cảnh_báo_thủ_tục_tố_tụng=procedural_warnings
    )
