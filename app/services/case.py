from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.models.case import CaseFile, CaseDocument, InvestigationLog
from app.models.suspect import Suspect
from app.schemas.case import CaseFileCreate, CaseFileUpdate, CaseFileOut, CaseDocumentCreate, InvestigationLogCreate
from app.schemas.suspect import SuspectCreate, SuspectUpdate
from app.core.exceptions import AppException
from typing import List, Optional, Any, Union

class CaseService:
    # Synchronous Case CRUD
    @staticmethod
    def list_cases(db: Session, user: Any, ip_address: Optional[str] = None) -> List[CaseFile]:
        if user.role == "INVESTIGATOR":
            return db.query(CaseFile).filter(CaseFile.lead_investigator_id == user.id).all()
        return db.query(CaseFile).all()

    @staticmethod
    def get_case(db: Session, case_id: int, user: Any, ip_address: Optional[str] = None) -> CaseFile:
        db_case = db.query(CaseFile).filter(CaseFile.id == case_id).first()
        if not db_case:
            raise AppException(message="Hồ sơ vụ án không tồn tại", code="NOT_FOUND", status_code=404)
        return db_case

    @staticmethod
    def create_case(db: Session, case_in: CaseFileCreate, user: Any, ip_address: Optional[str] = None) -> CaseFile:
        existing = db.query(CaseFile).filter(CaseFile.case_code == case_in.case_code).first()
        if existing:
            raise AppException(message=f"Số quyết định thụ lý/hồ sơ '{case_in.case_code}' đã tồn tại", code="BAD_REQUEST")

        db_case = CaseFile(
            case_code=case_in.case_code,
            case_name=case_in.case_name,
            incident_date=case_in.incident_date,
            location=case_in.location,
            summary_acts=case_in.summary_acts,
            damage_value=case_in.damage_value,
            status=case_in.status,
            investigation_stage=case_in.investigation_stage,
            lead_investigator_id=user.id
        )
        db.add(db_case)
        db.commit()
        db.refresh(db_case)
        return db_case

    @staticmethod
    def update_case(db: Session, case_id: int, case_in: CaseFileUpdate, user: Any, ip_address: Optional[str] = None) -> CaseFile:
        db_case = db.query(CaseFile).filter(CaseFile.id == case_id).first()
        if not db_case:
            raise AppException(message="Hồ sơ vụ án không tồn tại", code="NOT_FOUND", status_code=404)

        if user.role == "INVESTIGATOR" and db_case.lead_investigator_id != user.id:
            raise AppException(message="Bạn không có quyền cập nhật hồ sơ vụ án của điều tra viên khác", code="FORBIDDEN", status_code=403)

        if case_in.case_name is not None:
            db_case.case_name = case_in.case_name
        if case_in.summary_acts is not None:
            db_case.summary_acts = case_in.summary_acts
        if case_in.incident_date is not None:
            db_case.incident_date = case_in.incident_date
        if case_in.location is not None:
            db_case.location = case_in.location
        if case_in.damage_value is not None:
            db_case.damage_value = case_in.damage_value
        if case_in.status is not None:
            db_case.status = case_in.status
        if case_in.investigation_stage is not None:
            db_case.investigation_stage = case_in.investigation_stage

        db.commit()
        db.refresh(db_case)
        return db_case

    @staticmethod
    def delete_case(db: Session, case_id: int, user: Any, ip_address: Optional[str] = None) -> CaseFile:
        db_case = db.query(CaseFile).filter(CaseFile.id == case_id).first()
        if not db_case:
            raise AppException(message="Hồ sơ vụ án không tồn tại", code="NOT_FOUND", status_code=404)

        db.delete(db_case)
        db.commit()
        return db_case

    # Asynchronous Case CRUD (SQLAlchemy 2.0 AsyncSession)
    @staticmethod
    async def list_cases_async(db: AsyncSession, user: Any, ip_address: Optional[str] = None) -> List[CaseFileOut]:
        stmt = select(CaseFile).options(
            selectinload(CaseFile.suspects), 
            selectinload(CaseFile.investigation_logs),
            selectinload(CaseFile.documents)
        )
        if user.role == "INVESTIGATOR":
            stmt = stmt.where(CaseFile.lead_investigator_id == user.id)
        res = await db.execute(stmt)
        cases = res.scalars().all()
        return [CaseFileOut.model_validate(c) for c in cases]

    @staticmethod
    async def get_case_async(db: AsyncSession, case_id: int, user: Any, ip_address: Optional[str] = None) -> CaseFileOut:
        stmt = select(CaseFile).options(
            selectinload(CaseFile.suspects), 
            selectinload(CaseFile.investigation_logs),
            selectinload(CaseFile.documents)
        ).where(CaseFile.id == case_id)
        res = await db.execute(stmt)
        db_case = res.scalar_one_or_none()
        if not db_case:
            raise AppException(message="Hồ sơ vụ án không tồn tại", code="NOT_FOUND", status_code=404)
        return CaseFileOut.model_validate(db_case)

    @staticmethod
    async def create_case_async(db: AsyncSession, case_in: CaseFileCreate, user: Any, ip_address: Optional[str] = None) -> CaseFileOut:
        stmt = select(CaseFile).where(CaseFile.case_code == case_in.case_code)
        res = await db.execute(stmt)
        if res.scalar_one_or_none():
            raise AppException(message=f"Số quyết định thụ lý/hồ sơ '{case_in.case_code}' đã tồn tại", code="BAD_REQUEST")

        db_case = CaseFile(
            case_code=case_in.case_code,
            case_name=case_in.case_name,
            incident_date=case_in.incident_date,
            location=case_in.location,
            summary_acts=case_in.summary_acts,
            damage_value=case_in.damage_value,
            status=case_in.status,
            investigation_stage=case_in.investigation_stage,
            lead_investigator_id=user.id
        )
        db.add(db_case)
        await db.commit()

        stmt_created = select(CaseFile).options(
            selectinload(CaseFile.suspects),
            selectinload(CaseFile.investigation_logs),
            selectinload(CaseFile.documents)
        ).where(CaseFile.id == db_case.id)
        res_created = await db.execute(stmt_created)
        fresh_case = res_created.scalar_one()
        return CaseFileOut.model_validate(fresh_case)

    # Synchronous Suspect CRUD
    @staticmethod
    def list_suspects(db: Session, case_id: int, user: Any, ip_address: Optional[str] = None) -> List[Suspect]:
        CaseService.get_case(db, case_id, user, ip_address)
        return db.query(Suspect).filter(Suspect.case_id == case_id).all()

    @staticmethod
    def add_suspect(db: Session, case_id: int, suspect_in: SuspectCreate, user: Any, ip_address: Optional[str] = None) -> Suspect:
        db_case = CaseService.get_case(db, case_id, user, ip_address)
        if user.role == "INVESTIGATOR" and db_case.lead_investigator_id != user.id:
            raise AppException(message="Bạn không có quyền sửa đổi hồ sơ vụ án của điều tra viên khác", code="FORBIDDEN", status_code=403)

        db_suspect = Suspect(
            case_id=case_id,
            full_name=suspect_in.full_name,
            dob=suspect_in.dob,
            identity_card=suspect_in.identity_card,
            prior_convictions=suspect_in.prior_convictions,
            role_in_case=suspect_in.role_in_case
        )
        db.add(db_suspect)
        db.commit()
        db.refresh(db_suspect)
        return db_suspect

    @staticmethod
    def update_suspect(db: Session, case_id: int, suspect_id: int, suspect_in: SuspectUpdate, user: Any, ip_address: Optional[str] = None) -> Suspect:
        db_case = CaseService.get_case(db, case_id, user, ip_address)
        if user.role == "INVESTIGATOR" and db_case.lead_investigator_id != user.id:
            raise AppException(message="Bạn không có quyền sửa đổi hồ sơ vụ án của điều tra viên khác", code="FORBIDDEN", status_code=403)

        db_suspect = db.query(Suspect).filter(Suspect.id == suspect_id, Suspect.case_id == case_id).first()
        if not db_suspect:
            raise AppException(message="Đối tượng không tồn tại trong vụ án này", code="NOT_FOUND", status_code=404)

        if suspect_in.full_name is not None:
            db_suspect.full_name = suspect_in.full_name
        if suspect_in.dob is not None:
            db_suspect.dob = suspect_in.dob
        if suspect_in.identity_card is not None:
            db_suspect.identity_card = suspect_in.identity_card
        if suspect_in.prior_convictions is not None:
            db_suspect.prior_convictions = suspect_in.prior_convictions
        if suspect_in.role_in_case is not None:
            db_suspect.role_in_case = suspect_in.role_in_case

        db.commit()
        db.refresh(db_suspect)
        return db_suspect

    @staticmethod
    def remove_suspect(db: Session, case_id: int, suspect_id: int, user: Any, ip_address: Optional[str] = None) -> Suspect:
        db_case = CaseService.get_case(db, case_id, user, ip_address)
        if user.role == "INVESTIGATOR" and db_case.lead_investigator_id != user.id:
            raise AppException(message="Bạn không có quyền sửa đổi hồ sơ vụ án của điều tra viên khác", code="FORBIDDEN", status_code=403)

        db_suspect = db.query(Suspect).filter(Suspect.id == suspect_id, Suspect.case_id == case_id).first()
        if not db_suspect:
            raise AppException(message="Đối tượng không tồn tại trong vụ án này", code="NOT_FOUND", status_code=404)

        db.delete(db_suspect)
        db.commit()
        return db_suspect

    # Synchronous Document & Timeline CRUD
    @staticmethod
    def list_documents(db: Session, case_id: int, user: Any, ip_address: Optional[str] = None) -> List[CaseDocument]:
        CaseService.get_case(db, case_id, user, ip_address)
        return db.query(CaseDocument).filter(CaseDocument.case_id == case_id).all()

    @staticmethod
    def add_document(db: Session, case_id: int, doc_in: CaseDocumentCreate, user: Any, ip_address: Optional[str] = None) -> CaseDocument:
        db_case = CaseService.get_case(db, case_id, user, ip_address)
        if user.role == "INVESTIGATOR" and db_case.lead_investigator_id != user.id:
            raise AppException(message="Bạn không có quyền sửa đổi hồ sơ vụ án của điều tra viên khác", code="FORBIDDEN", status_code=403)

        db_doc = CaseDocument(
            case_id=case_id,
            name=doc_in.name,
            document_type=doc_in.document_type,
            file_path=doc_in.file_path
        )
        db.add(db_doc)
        db.commit()
        db.refresh(db_doc)
        return db_doc

    @staticmethod
    def remove_document(db: Session, case_id: int, document_id: int, user: Any, ip_address: Optional[str] = None) -> CaseDocument:
        db_case = CaseService.get_case(db, case_id, user, ip_address)
        if user.role == "INVESTIGATOR" and db_case.lead_investigator_id != user.id:
            raise AppException(message="Bạn không có quyền sửa đổi hồ sơ vụ án của điều tra viên khác", code="FORBIDDEN", status_code=403)

        db_doc = db.query(CaseDocument).filter(CaseDocument.id == document_id, CaseDocument.case_id == case_id).first()
        if not db_doc:
            raise AppException(message="Tài liệu không tồn tại trong vụ án này", code="NOT_FOUND", status_code=404)

        db.delete(db_doc)
        db.commit()
        return db_doc

    @staticmethod
    def list_logs(db: Session, case_id: int, user: Any, ip_address: Optional[str] = None) -> List[InvestigationLog]:
        CaseService.get_case(db, case_id, user, ip_address)
        return db.query(InvestigationLog).filter(InvestigationLog.case_id == case_id).order_by(InvestigationLog.log_date.desc()).all()

    @staticmethod
    def add_log(db: Session, case_id: int, log_in: InvestigationLogCreate, user: Any, ip_address: Optional[str] = None) -> InvestigationLog:
        db_case = CaseService.get_case(db, case_id, user, ip_address)
        if user.role == "INVESTIGATOR" and db_case.lead_investigator_id != user.id:
            raise AppException(message="Bạn không có quyền sửa đổi hồ sơ vụ án của điều tra viên khác", code="FORBIDDEN", status_code=403)

        db_log = InvestigationLog(
            case_id=case_id,
            title=log_in.title,
            details=log_in.details,
            investigator_id=user.id
        )
        db.add(db_log)
        db.commit()
        db.refresh(db_log)
        return db_log

    @staticmethod
    def remove_log(db: Session, case_id: int, log_id: int, user: Any, ip_address: Optional[str] = None) -> InvestigationLog:
        db_case = CaseService.get_case(db, case_id, user, ip_address)
        if user.role == "INVESTIGATOR" and db_case.lead_investigator_id != user.id:
            raise AppException(message="Bạn không có quyền sửa đổi hồ sơ vụ án của điều tra viên khác", code="FORBIDDEN", status_code=403)

        db_log = db.query(InvestigationLog).filter(InvestigationLog.id == log_id, InvestigationLog.case_id == case_id).first()
        if not db_log:
            raise AppException(message="Sự kiện nhật ký không tồn tại trong vụ án này", code="NOT_FOUND", status_code=404)

        db.delete(db_log)
        db.commit()
        return db_log
