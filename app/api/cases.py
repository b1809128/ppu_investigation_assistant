from fastapi import APIRouter, Depends, status, Request
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.core.security import get_current_user, allow_leadership
from app.schemas.case import CaseFileCreate, CaseFileUpdate, CaseFileOut
from app.schemas.suspect import SuspectCreate, SuspectUpdate, SuspectOut
from app.services.case import CaseService
from app.models.user import User
from app.core.audit_decorator import audit_log

router = APIRouter(prefix="/cases", tags=["Case Management"])

# Case File CRUD Endpoints

@router.get("", response_model=List[CaseFileOut])
@audit_log(action="LIST_CASES", resource_type="CASE_FILE")
def read_cases(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all investigation cases assigned to the logged-in investigator (or all cases for leadership/admin).
    Automatically audited via decorator.
    """
    client_ip = request.client.host if request.client else None
    return CaseService.list_cases(db, user=current_user, ip_address=client_ip)

@router.post("", response_model=CaseFileOut, status_code=status.HTTP_201_CREATED)
@audit_log(action="CREATE_CASE", resource_type="CASE_FILE")
def create_case(
    request: Request,
    case_in: CaseFileCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new investigation case.
    Automatically audited via decorator.
    """
    client_ip = request.client.host if request.client else None
    return CaseService.create_case(db, case_in, user=current_user, ip_address=client_ip)

@router.get("/{case_id}", response_model=CaseFileOut)
@audit_log(action="READ_CASE", resource_type="CASE_FILE")
def read_case_by_id(
    case_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get detailed case profile.
    Automatically audited via decorator.
    """
    client_ip = request.client.host if request.client else None
    return CaseService.get_case(db, case_id=case_id, user=current_user, ip_address=client_ip)

@router.put("/{case_id}", response_model=CaseFileOut)
@audit_log(action="UPDATE_CASE", resource_type="CASE_FILE")
def update_case(
    case_id: int,
    case_in: CaseFileUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Modify case description or status.
    Investigators can only update their own cases; leadership/admin can update any.
    Automatically audited via decorator.
    """
    client_ip = request.client.host if request.client else None
    return CaseService.update_case(db, case_id=case_id, case_in=case_in, user=current_user, ip_address=client_ip)

@router.delete("/{case_id}", response_model=CaseFileOut)
@audit_log(action="DELETE_CASE", resource_type="CASE_FILE")
def delete_case(
    case_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_leadership)
):
    """
    Delete a case. Restricted to Admin and Leadership roles.
    Automatically audited via decorator.
    """
    client_ip = request.client.host if request.client else None
    return CaseService.delete_case(db, case_id=case_id, user=current_user, ip_address=client_ip)


# Suspect / Associated Person Endpoints

@router.get("/{case_id}/suspects", response_model=List[SuspectOut])
@audit_log(action="LIST_SUSPECTS", resource_type="SUSPECT")
def read_suspects(
    case_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all people (suspects, victims, witnesses) associated with a case.
    Automatically audited via decorator.
    """
    client_ip = request.client.host if request.client else None
    return CaseService.list_suspects(db, case_id=case_id, user=current_user, ip_address=client_ip)

@router.post("/{case_id}/suspects", response_model=SuspectOut, status_code=status.HTTP_201_CREATED)
@audit_log(action="ADD_SUSPECT", resource_type="SUSPECT")
def add_suspect_to_case(
    case_id: int,
    suspect_in: SuspectCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Add a suspect profile to a case file.
    Investigators can only modify their own cases.
    Automatically audited via decorator.
    """
    client_ip = request.client.host if request.client else None
    return CaseService.add_suspect(db, case_id=case_id, suspect_in=suspect_in, user=current_user, ip_address=client_ip)

@router.put("/{case_id}/suspects/{suspect_id}", response_model=SuspectOut)
@audit_log(action="UPDATE_SUSPECT", resource_type="SUSPECT")
def update_suspect_details(
    case_id: int,
    suspect_id: int,
    suspect_in: SuspectUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Modify detail fields of a suspect profile.
    Automatically audited via decorator.
    """
    client_ip = request.client.host if request.client else None
    return CaseService.update_suspect(db, case_id=case_id, suspect_id=suspect_id, suspect_in=suspect_in, user=current_user, ip_address=client_ip)

@router.delete("/{case_id}/suspects/{suspect_id}", response_model=SuspectOut)
@audit_log(action="REMOVE_SUSPECT", resource_type="SUSPECT")
def remove_suspect_from_case(
    case_id: int,
    suspect_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Remove a suspect profile from a case.
    Automatically audited via decorator.
    """
    client_ip = request.client.host if request.client else None
    return CaseService.remove_suspect(db, case_id=case_id, suspect_id=suspect_id, user=current_user, ip_address=client_ip)
