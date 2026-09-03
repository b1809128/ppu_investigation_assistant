from pydantic import BaseModel, Field, ConfigDict
from typing import Literal, Optional

class ProceduralCheckResult(BaseModel):
    """
    Pydantic Schema representing procedural inspection result
    for detention timelines (Tạm giữ) and custody limits (Tạm giam).
    """
    status: Literal['NORMAL', 'WARNING', 'CRITICAL'] = Field(
        ..., 
        description="Procedural health status: NORMAL, WARNING, or CRITICAL"
    )
    days_remaining: int = Field(
        ..., 
        description="Number of days remaining before deadline expiration"
    )
    recommendation: str = Field(
        ..., 
        description="Actionable legal recommendation for investigator"
    )
    days_elapsed: Optional[int] = Field(
        None, 
        description="Total days elapsed since start date"
    )
    max_days: Optional[int] = Field(
        None, 
        description="Maximum authorized days allowed under Criminal Procedure Code"
    )
    article_reference: Optional[str] = Field(
        None, 
        description="Reference to relevant articles in Vietnam Criminal Procedure Code (BLTTHS)"
    )

    model_config = ConfigDict(from_attributes=True)
