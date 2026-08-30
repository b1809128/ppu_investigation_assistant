from pydantic import BaseModel
from typing import List, Optional

class LegalArticle(BaseModel):
    chuong: str
    ten_chuong: str
    dieu: int
    ten_dieu: str
    noi_dung: str
    keywords: List[str]
    chu_the_thuc_hien: Optional[List[str]] = None
    hoat_dong_nghiep_vu: Optional[List[str]] = None
    bieu_mau_van_ban: Optional[List[str]] = None

class LegalMatchRequest(BaseModel):
    behavior_description: str

class LegalMatchResult(BaseModel):
    article: LegalArticle
    matched_keywords: List[str]
    score: float
