from pydantic import BaseModel, Field, AliasChoices, computed_field
from datetime import datetime
from typing import Optional

class UserBase(BaseModel):
    badge_id: str = Field(..., validation_alias=AliasChoices("badge_id", "username"), min_length=3, max_length=50)
    full_name: str = Field(..., min_length=1, max_length=100)
    role: str = Field(default="INVESTIGATOR")  # ADMIN, LEADERSHIP, INVESTIGATOR

class UserCreate(UserBase):
    password: str = Field(..., min_length=4, max_length=100)

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None

class UserOut(BaseModel):
    id: int
    badge_id: str
    full_name: str
    role: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    @computed_field
    @property
    def username(self) -> str:
        """Backwards compatibility for username field."""
        return self.badge_id

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    badge_id: Optional[str] = Field(None, validation_alias=AliasChoices("badge_id", "username"))
    role: Optional[str] = None

    @computed_field
    @property
    def username(self) -> Optional[str]:
        """Backwards compatibility for username field."""
        return self.badge_id
