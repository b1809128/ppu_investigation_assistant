from pydantic import BaseModel, Field, AliasChoices, computed_field
from datetime import datetime
from typing import Optional

class CaseFileBase(BaseModel):
    case_code: str = Field(..., validation_alias=AliasChoices("case_code", "case_number"), max_length=50)
    case_name: str = Field(..., validation_alias=AliasChoices("case_name", "title"), max_length=255)
    incident_date: Optional[datetime] = None
    location: Optional[str] = None
    summary_acts: Optional[str] = Field(None, validation_alias=AliasChoices("summary_acts", "description"))
    damage_value: Optional[float] = None
    status: str = "INVESTIGATING"  # INVESTIGATING, SUSPENDED, CLOSED

class CaseFileCreate(CaseFileBase):
    pass

class CaseFileUpdate(BaseModel):
    case_name: Optional[str] = Field(None, validation_alias=AliasChoices("case_name", "title"))
    summary_acts: Optional[str] = Field(None, validation_alias=AliasChoices("summary_acts", "description"))
    incident_date: Optional[datetime] = None
    location: Optional[str] = None
    damage_value: Optional[float] = None
    status: Optional[str] = None

class CaseFileOut(BaseModel):
    id: int
    case_code: str
    case_name: str
    incident_date: Optional[datetime] = None
    location: Optional[str] = None
    summary_acts: Optional[str] = None
    damage_value: Optional[float] = None
    status: str
    lead_investigator_id: int
    created_at: datetime
    updated_at: datetime

    @computed_field
    @property
    def case_number(self) -> str:
        """Backwards compatibility for case_number."""
        return self.case_code

    @computed_field
    @property
    def title(self) -> str:
        """Backwards compatibility for title."""
        return self.case_name

    @computed_field
    @property
    def description(self) -> Optional[str]:
        """Backwards compatibility for description."""
        return self.summary_acts

    @computed_field
    @property
    def created_by_id(self) -> int:
        """Backwards compatibility for created_by_id."""
        return self.lead_investigator_id

    class Config:
        from_attributes = True
        populate_by_name = True
