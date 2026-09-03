from pydantic import BaseModel, Field, AliasChoices, computed_field, ConfigDict, field_serializer
from datetime import datetime
from typing import Optional

def mask_identity_card_value(val: Optional[str]) -> Optional[str]:
    """
    Mask CCCD / CMND number to format 035***891.
    Preserves first 3 and last 3 characters, masking middle characters with ***.
    """
    if not val:
        return val
    s = str(val).strip()
    if len(s) >= 6:
        return f"{s[:3]}***{s[-3:]}"
    elif len(s) > 2:
        return f"{s[0]}***{s[-1]}"
    return s

class SuspectBase(BaseModel):
    full_name: str = Field(..., max_length=100)
    dob: Optional[str] = Field(None, validation_alias=AliasChoices("dob", "date_of_birth"), max_length=20)
    identity_card: Optional[str] = Field(None, max_length=20)
    prior_convictions: Optional[str] = Field(None, validation_alias=AliasChoices("prior_convictions", "address"), max_length=255)
    role_in_case: str = "SUSPECT"  # SUSPECT, WITNESS, VICTIM, OTHER

class SuspectCreate(SuspectBase):
    pass

class SuspectUpdate(BaseModel):
    full_name: Optional[str] = None
    dob: Optional[str] = Field(None, validation_alias=AliasChoices("dob", "date_of_birth"))
    identity_card: Optional[str] = None
    prior_convictions: Optional[str] = Field(None, validation_alias=AliasChoices("prior_convictions", "address"))
    role_in_case: Optional[str] = None

class SuspectOut(BaseModel):
    id: int
    case_id: int = Field(..., validation_alias=AliasChoices("case_id", "case_file_id"))
    full_name: str
    dob: Optional[str] = None
    identity_card: Optional[str] = None
    prior_convictions: Optional[str] = None
    role_in_case: str
    created_at: datetime
    updated_at: datetime

    @field_serializer("identity_card")
    def serialize_identity_card(self, v: Optional[str], _info) -> Optional[str]:
        return mask_identity_card_value(v)

    @computed_field
    @property
    def case_file_id(self) -> int:
        """Backwards compatibility for case_file_id."""
        return self.case_id

    @computed_field
    @property
    def date_of_birth(self) -> Optional[str]:
        """Backwards compatibility for date_of_birth."""
        return self.dob

    @computed_field
    @property
    def address(self) -> Optional[str]:
        """Backwards compatibility for address."""
        return self.prior_convictions

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True
    )
