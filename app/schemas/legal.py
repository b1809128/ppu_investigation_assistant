from pydantic import BaseModel
from typing import List, Optional

class LegalArticle(BaseModel):
    chuong: str
    ten_chuong: str
    dieu: int
    ten_dieu: str
    noi_dung: str
    keywords: List[str]

class LegalMatchRequest(BaseModel):
    behavior_description: str

class LegalMatchResult(BaseModel):
    article: LegalArticle
    matched_keywords: List[str]
    score: float
