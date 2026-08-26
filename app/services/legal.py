import json
import os
import logging
from typing import List, Dict, Any, Optional
from app.schemas.legal import LegalArticle, LegalMatchResult

logger = logging.getLogger("uvicorn.error")

class LegalService:
    # Class-level cache for articles
    _articles: List[Dict[str, Any]] = []

    @classmethod
    def load_database(cls, filepath: str) -> None:
        """
        Loads the Penal Code JSON file into memory.
        This must be called at startup.
        """
        if not os.path.exists(filepath):
            logger.error(f"Tệp luật không tồn tại tại: {filepath}")
            cls._articles = []
            return
            
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                cls._articles = json.load(f)
            logger.info(f"Đã tải thành công {len(cls._articles)} điều luật Hình sự 2015 vào bộ nhớ cache.")
        except Exception as e:
            logger.error(f"Lỗi khi tải tệp luật: {str(e)}")
            cls._articles = []

    @classmethod
    def search_articles(cls, query: Optional[str] = None, dieu: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Search Penal Code articles in cache.
        If 'dieu' is provided, performs exact lookup.
        If 'query' is provided, performs case-insensitive keyword searches on text fields.
        """
        results = []
        for art in cls._articles:
            if dieu is not None and art.get("dieu") == dieu:
                results.append(art)
                continue
                
            if query:
                q = query.lower().strip()
                match_title = q in art.get("ten_dieu", "").lower()
                match_content = q in art.get("noi_dung", "").lower()
                match_keywords = any(q in kw.lower() for kw in art.get("keywords", []))
                
                if match_title or match_content or match_keywords:
                    results.append(art)
                    
        # If neither is provided, return all cached articles
        if query is None and dieu is None:
            return cls._articles
            
        return results

    @classmethod
    def match_behavior(cls, behavior_description: str) -> List[LegalMatchResult]:
        """
        Compares an investigator's suspect behavior text description against Penal Code articles.
        Matches keywords and returns a sorted list of potential article matches by relevance.
        """
        if not behavior_description or not cls._articles:
            return []

        desc_lower = behavior_description.lower()
        matches: List[LegalMatchResult] = []

        for art in cls._articles:
            # Only match against articles defining actual criminal offenses (dieu >= 109)
            if art.get("dieu", 0) < 109:
                continue
            matched_kws = []
            for kw in art.get("keywords", []):
                # Simple substring check (word boundaries could be checked, but substring works well for Viet keywords)
                if kw.lower() in desc_lower:
                    matched_kws.append(kw)
            
            if matched_kws:
                # Calculate simple matching score
                # Base relevance = count of matched keywords
                # Percentage score = matched keywords / total keywords in the article
                score = round((len(matched_kws) / len(art.get("keywords", [1]))) * 100.0, 2)
                
                legal_art = LegalArticle(
                    chuong=art["chuong"],
                    ten_chuong=art["ten_chuong"],
                    dieu=art["dieu"],
                    ten_dieu=art["ten_dieu"],
                    noi_dung=art["noi_dung"],
                    keywords=art["keywords"]
                )
                
                matches.append(LegalMatchResult(
                    article=legal_art,
                    matched_keywords=matched_kws,
                    score=score
                ))

        # Sort matches by score descending, then by article number ascending
        matches.sort(key=lambda x: (-x.score, x.article.dieu))
        return matches
