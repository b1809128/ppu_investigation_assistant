from sqlalchemy.orm import Session
from app.models.case import CaseFile
from app.models.suspect import Suspect
from app.schemas.case import CaseFileCreate, CaseFileUpdate
from app.schemas.suspect import SuspectCreate, SuspectUpdate
from app.core.exceptions import AppException
from typing import List, Optional, Any

class CaseService:
    @staticmethod
    def list_cases(db: Session, user: Any, ip_address: Optional[str] = None) -> List[CaseFile]:
        """
        List investigation cases. 
        If the user is an INVESTIGATOR, filter cases where they are the lead investigator.
        Leadership and Admin can view all cases.
        """
        if user.role == "INVESTIGATOR":
            return db.query(CaseFile).filter(CaseFile.lead_investigator_id == user.id).all()
        return db.query(CaseFile).all()

    @staticmethod
    def get_case(db: Session, case_id: int, user: Any, ip_address: Optional[str] = None) -> CaseFile:
        """
        Retrieve a single case.
        """
        db_case = db.query(CaseFile).filter(CaseFile.id == case_id).first()
        if not db_case:
            raise AppException(message="Hồ sơ vụ án không tồn tại", code="NOT_FOUND", status_code=404)
        return db_case

    @staticmethod
    def create_case(db: Session, case_in: CaseFileCreate, user: Any, ip_address: Optional[str] = None) -> CaseFile:
        """
        Create a new case file.
        """
        # Check if case code exists
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
            lead_investigator_id=user.id
        )
        db.add(db_case)
        db.commit()
        db.refresh(db_case)
        return db_case

    @staticmethod
    def update_case(db: Session, case_id: int, case_in: CaseFileUpdate, user: Any, ip_address: Optional[str] = None) -> CaseFile:
        """
        Update case details.
        """
        db_case = db.query(CaseFile).filter(CaseFile.id == case_id).first()
        if not db_case:
            raise AppException(message="Hồ sơ vụ án không tồn tại", code="NOT_FOUND", status_code=404)

        # RBAC Check: INVESTIGATOR can only update their own case files.
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

        db.commit()
        db.refresh(db_case)
        return db_case

    @staticmethod
    def delete_case(db: Session, case_id: int, user: Any, ip_address: Optional[str] = None) -> CaseFile:
        """
        Delete a case. Only ADMIN & LEADERSHIP allowed.
        """
        db_case = db.query(CaseFile).filter(CaseFile.id == case_id).first()
        if not db_case:
            raise AppException(message="Hồ sơ vụ án không tồn tại", code="NOT_FOUND", status_code=404)

        db.delete(db_case)
        db.commit()
        return db_case

    # Suspect Management Functions

    @staticmethod
    def list_suspects(db: Session, case_id: int, user: Any, ip_address: Optional[str] = None) -> List[Suspect]:
        # First check if the case exists
        CaseService.get_case(db, case_id, user, ip_address)
        return db.query(Suspect).filter(Suspect.case_id == case_id).all()

    @staticmethod
    def add_suspect(db: Session, case_id: int, suspect_in: SuspectCreate, user: Any, ip_address: Optional[str] = None) -> Suspect:
        # Check case existence
        db_case = CaseService.get_case(db, case_id, user, ip_address)

        # RBAC Check: INVESTIGATOR can only add suspects to their own case files.
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
        # Check case existence
        db_case = CaseService.get_case(db, case_id, user, ip_address)

        # RBAC Check
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
        # Check case existence
        db_case = CaseService.get_case(db, case_id, user, ip_address)

        # RBAC Check
        if user.role == "INVESTIGATOR" and db_case.lead_investigator_id != user.id:
            raise AppException(message="Bạn không có quyền sửa đổi hồ sơ vụ án của điều tra viên khác", code="FORBIDDEN", status_code=403)

        db_suspect = db.query(Suspect).filter(Suspect.id == suspect_id, Suspect.case_id == case_id).first()
        if not db_suspect:
            raise AppException(message="Đối tượng không tồn tại trong vụ án này", code="NOT_FOUND", status_code=404)

        db.delete(db_suspect)
        db.commit()
        return db_suspect
