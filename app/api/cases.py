from fastapi import APIRouter, Depends, status, Request, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
import os
import shutil

from app.db.session import get_db, get_async_db
from app.core.security import get_current_user, allow_leadership
from app.schemas.case import CaseFileCreate, CaseFileUpdate, CaseFileOut, CaseDocumentCreate, CaseDocumentOut, InvestigationLogCreate, InvestigationLogOut
from app.schemas.suspect import SuspectCreate, SuspectUpdate, SuspectOut
from app.services.case import CaseService
from app.models.user import User
from app.core.audit_decorator import audit_log

router = APIRouter(prefix="/cases", tags=["Case Management"])

# Case File CRUD Endpoints

@router.get("", response_model=List[CaseFileOut])
@audit_log(action="LIST_CASES", resource_type="CASE_FILE")
async def read_cases(
    request: Request,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all investigation cases assigned to the logged-in investigator (or all cases for leadership/admin).
    Automatically audited via decorator.
    """
    client_ip = request.client.host if request.client else None
    return await CaseService.list_cases_async(db, user=current_user, ip_address=client_ip)

@router.post("", response_model=CaseFileOut, status_code=status.HTTP_201_CREATED)
@audit_log(action="CREATE_CASE", resource_type="CASE_FILE")
async def create_case(
    request: Request,
    case_in: CaseFileCreate,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new investigation case.
    Automatically audited via decorator.
    """
    client_ip = request.client.host if request.client else None
    return await CaseService.create_case_async(db, case_in, user=current_user, ip_address=client_ip)

@router.get("/{case_id}", response_model=CaseFileOut)
@audit_log(action="READ_CASE", resource_type="CASE_FILE")
async def read_case_by_id(
    case_id: int,
    request: Request,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get detailed case profile.
    Automatically audited via decorator.
    """
    client_ip = request.client.host if request.client else None
    return await CaseService.get_case_async(db, case_id=case_id, user=current_user, ip_address=client_ip)

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

@router.get("/{case_id}/documents", response_model=List[CaseDocumentOut])
@audit_log(action="LIST_DOCUMENTS", resource_type="CASE_DOCUMENT")
def list_case_documents(
    case_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all procedural documents in a case.
    """
    client_ip = request.client.host if request.client else None
    return CaseService.list_documents(db, case_id=case_id, user=current_user, ip_address=client_ip)

@router.post("/{case_id}/documents", response_model=CaseDocumentOut)
@audit_log(action="ADD_DOCUMENT", resource_type="CASE_DOCUMENT")
def add_document_to_case(
    case_id: int,
    doc_in: CaseDocumentCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Add a new procedural document to a case.
    """
    client_ip = request.client.host if request.client else None
    return CaseService.add_document(db, case_id=case_id, doc_in=doc_in, user=current_user, ip_address=client_ip)

@router.delete("/{case_id}/documents/{document_id}", response_model=CaseDocumentOut)
@audit_log(action="REMOVE_DOCUMENT", resource_type="CASE_DOCUMENT")
def remove_document_from_case(
    case_id: int,
    document_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Remove a procedural document from a case.
    """
    client_ip = request.client.host if request.client else None
    return CaseService.remove_document(db, case_id=case_id, document_id=document_id, user=current_user, ip_address=client_ip)

@router.post("/{case_id}/documents/upload", response_model=CaseDocumentOut)
@audit_log(action="UPLOAD_DOCUMENT", resource_type="CASE_DOCUMENT")
def upload_document_to_case(
    case_id: int,
    request: Request,
    name: str = Form(...),
    document_type: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Upload a scan file/PDF and link it as a procedural document.
    """
    from datetime import datetime
    client_ip = request.client.host if request.client else None
    
    uploads_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "uploads")
    os.makedirs(uploads_dir, exist_ok=True)
    
    safe_filename = f"case_{case_id}_{int(datetime.now().timestamp())}_{file.filename}"
    safe_filename = safe_filename.replace(" ", "_")
    file_path = os.path.join(uploads_dir, safe_filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    doc_in = CaseDocumentCreate(
        name=name,
        document_type=document_type,
        file_path=f"/uploads/{safe_filename}"
    )
    
    return CaseService.add_document(db, case_id=case_id, doc_in=doc_in, user=current_user, ip_address=client_ip)


# Investigation Process Timeline Logs Endpoints

@router.get("/{case_id}/logs", response_model=List[InvestigationLogOut])
@audit_log(action="LIST_INVESTIGATION_LOGS", resource_type="CASE_FILE")
def list_investigation_logs(
    case_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all logs in the investigation timeline.
    """
    client_ip = request.client.host if request.client else None
    return CaseService.list_logs(db, case_id=case_id, user=current_user, ip_address=client_ip)

@router.post("/{case_id}/logs", response_model=InvestigationLogOut, status_code=status.HTTP_201_CREATED)
@audit_log(action="ADD_INVESTIGATION_LOG", resource_type="CASE_FILE")
def add_investigation_log(
    case_id: int,
    log_in: InvestigationLogCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Add a new milestone/event to the case investigation process.
    """
    client_ip = request.client.host if request.client else None
    return CaseService.add_log(db, case_id=case_id, log_in=log_in, user=current_user, ip_address=client_ip)

@router.delete("/{case_id}/logs/{log_id}", response_model=InvestigationLogOut)
@audit_log(action="REMOVE_INVESTIGATION_LOG", resource_type="CASE_FILE")
def remove_investigation_log(
    case_id: int,
    log_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Remove an event from the case timeline.
    """
    client_ip = request.client.host if request.client else None
    return CaseService.remove_log(db, case_id=case_id, log_id=log_id, user=current_user, ip_address=client_ip)
