import pytest
import pytest_asyncio
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.db.base import Base
from app.models.user import User
from app.models.case import CaseFile
from app.models.suspect import Suspect
from app.models.audit import AuditLog
from app.schemas.suspect import SuspectOut, mask_identity_card_value
from app.schemas.case import CaseFileOut
from app.services.case import CaseService
from app.services.audit import AuditService


def test_suspect_cccd_masking():
    """Verify automatic CCCD masking in SuspectOut Pydantic v2 schema."""
    suspect_data = {
        "id": 1,
        "case_id": 10,
        "full_name": "Nguyễn Văn A",
        "dob": "1990-05-15",
        "identity_card": "035123456891",
        "prior_convictions": "Không có tiền án",
        "role_in_case": "SUSPECT",
        "created_at": datetime.now(),
        "updated_at": datetime.now()
    }
    
    suspect_out = SuspectOut(**suspect_data)
    serialized = suspect_out.model_dump()
    
    # Check that identity_card is masked as 035***891 upon dump / JSON serialization
    assert serialized["identity_card"] == "035***891"
    assert mask_identity_card_value("035123456891") == "035***891"
    assert mask_identity_card_value("035987654321") == "035***321"
    assert mask_identity_card_value(None) is None


@pytest.mark.anyio
async def test_async_case_file_and_audit_logging(tmp_path):
    """Test CaseFile retrieval with AsyncSession and AuditLog verification."""
    db_file = tmp_path / "test.db"
    async_url = f"sqlite+aiosqlite:///{db_file}"
    
    async_engine = create_async_engine(async_url, echo=False)
    
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    AsyncSessionMaker = async_sessionmaker(bind=async_engine, class_=AsyncSession, expire_on_commit=False)
    
    async with AsyncSessionMaker() as db:
        # Create test user
        user = User(
            id=1,
            badge_id="dtv001",
            password_hash="hashed_pw",
            full_name="Điều tra viên A",
            role="INVESTIGATOR",
            is_active=True
        )
        db.add(user)
        
        # Create test case file
        case = CaseFile(
            id=1,
            case_code="HS-2026/001",
            case_name="Vụ án trộm cắp tài sản",
            lead_investigator_id=1,
            status="INVESTIGATING",
            investigation_stage="XAC_MINH"
        )
        db.add(case)
        
        # Create suspect with CCCD
        suspect = Suspect(
            id=1,
            case_id=1,
            full_name="Trần Văn B",
            identity_card="035123456891",
            role_in_case="SUSPECT"
        )
        db.add(suspect)
        await db.commit()
        
        # Query case using CaseService.get_case_async
        fetched_case = await CaseService.get_case_async(db=db, case_id=1, user=user)
        assert fetched_case.case_code == "HS-2026/001"
        assert len(fetched_case.suspects) == 1
        
        # Validate Pydantic v2 serialization of fetched case
        case_out = CaseFileOut.model_validate(fetched_case)
        serialized_case = case_out.model_dump()
        assert serialized_case["suspects"][0]["identity_card"] == "035***891"
        
        # Log audit entry
        await AuditService.async_log(
            db=db,
            action="READ_CASE",
            resource_type="CASE_FILE",
            resource_id=1,
            user_id=1,
            username="dtv001",
            details={"case_code": fetched_case.case_code},
            ip_address="127.0.0.1"
        )
        
        # Verify AuditLog created
        from sqlalchemy.future import select
        res = await db.execute(select(AuditLog).where(AuditLog.resource_id == 1))
        logs = res.scalars().all()
        assert len(logs) == 1
        assert logs[0].action == "READ_CASE"
        assert logs[0].username == "dtv001"
        
    await async_engine.dispose()
