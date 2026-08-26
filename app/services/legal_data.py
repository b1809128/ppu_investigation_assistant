import json
import os
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger("uvicorn.error")

class LegalDataService:
    # Raw items read from JSON file
    _raw_articles: List[Dict[str, Any]] = []

    # In-memory index structures for O(1) lookups
    _articles_by_id: Dict[int, Dict[str, Any]] = {}
    _articles_by_chapter: Dict[str, List[Dict[str, Any]]] = {}
    _articles_by_keyword: Dict[str, List[Dict[str, Any]]] = {}

    @classmethod
    def load_database(cls, filepath: str) -> None:
        """
        Loads the Penal Code JSON file into memory and builds O(1) search indexes.
        Should be called at application startup (Lifespan event).
        """
        if not os.path.exists(filepath):
            logger.error(f"LegalDataService: Tệp dữ liệu luật không tồn tại tại: {filepath}")
            cls.clear()
            return

        try:
            with open(filepath, "r", encoding="utf-8") as f:
                cls._raw_articles = json.load(f)

            # Rebuild indexes
            cls._articles_by_id = {}
            cls._articles_by_chapter = {}
            cls._articles_by_keyword = {}

            for article in cls._raw_articles:
                # 1. Index by article_id (dieu)
                art_id = article.get("dieu")
                if art_id is not None:
                    cls._articles_by_id[int(art_id)] = article

                # 2. Index by chapter_id (chuong)
                chap_id = article.get("chuong")
                if chap_id:
                    if chap_id not in cls._articles_by_chapter:
                        cls._articles_by_chapter[chap_id] = []
                    cls._articles_by_chapter[chap_id].append(article)

                # 3. Index by keywords (normalized)
                keywords = article.get("keywords", [])
                for kw in keywords:
                    kw_clean = kw.strip().lower()
                    if kw_clean:
                        if kw_clean not in cls._articles_by_keyword:
                            cls._articles_by_keyword[kw_clean] = []
                        if article not in cls._articles_by_keyword[kw_clean]:
                            cls._articles_by_keyword[kw_clean].append(article)

            logger.info(
                f"LegalDataService: Đã tải và lập chỉ mục {len(cls._raw_articles)} điều luật thành công. "
                f"Chỉ mục: {len(cls._articles_by_id)} điều luật (O(1)), "
                f"{len(cls._articles_by_chapter)} chương (O(1)), "
                f"{len(cls._articles_by_keyword)} từ khóa (O(1))."
            )
        except Exception as e:
            logger.error(f"LegalDataService: Lỗi khi tải hoặc lập chỉ mục tệp luật: {str(e)}")
            cls.clear()

    @classmethod
    def clear(cls) -> None:
        """Clears all raw data and indexes."""
        cls._raw_articles = []
        cls._articles_by_id = {}
        cls._articles_by_chapter = {}
        cls._articles_by_keyword = {}

    @classmethod
    def get_by_article_id(cls, article_id: int) -> Optional[Dict[str, Any]]:
        """O(1) lookup by article_id (dieu)"""
        return cls._articles_by_id.get(article_id)

    @classmethod
    def get_by_chapter_id(cls, chapter_id: str) -> List[Dict[str, Any]]:
        """O(1) lookup by chapter_id (chuong)"""
        return cls._articles_by_chapter.get(chapter_id, [])

    @classmethod
    def get_by_keyword(cls, keyword: str) -> List[Dict[str, Any]]:
        """O(1) lookup by exact keyword (case-insensitive)"""
        return cls._articles_by_keyword.get(keyword.strip().lower(), [])

    @classmethod
    def search(
        cls,
        behavior_keyword: Optional[str] = None,
        article_id: Optional[int] = None,
        chapter_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Search penal code articles using O(1) in-memory indexes.
        Supports searching/filtering by:
        - article_id (highest precedence, O(1))
        - chapter_id (O(1) lookup, with optional behavior_keyword filtering)
        - behavior_keyword (O(1) exact keyword match, with fallback to substring search)
        """
        # Case 1: Search by exact article_id (dieu) -> returns at most 1 article
        if article_id is not None:
            art = cls.get_by_article_id(article_id)
            return [art] if art else []

        # Case 2: Search by chapter_id (chuong)
        if chapter_id is not None:
            results = cls.get_by_chapter_id(chapter_id)
            if behavior_keyword:
                kw_clean = behavior_keyword.strip().lower()
                results = [
                    art for art in results
                    if any(kw_clean in k.lower() for k in art.get("keywords", [])) or
                       kw_clean in art.get("ten_dieu", "").lower() or
                       kw_clean in art.get("noi_dung", "").lower()
                ]
            return results

        # Case 3: Search by behavior_keyword
        if behavior_keyword is not None:
            kw_clean = behavior_keyword.strip().lower()
            # First try exact match in the keyword index (O(1))
            exact_matches = cls.get_by_keyword(kw_clean)
            if exact_matches:
                return exact_matches

            # Fallback to substring matching across all fields for usability/flexibility
            results = []
            for art in cls._raw_articles:
                match_kw = any(kw_clean in k.lower() for k in art.get("keywords", []))
                match_title = kw_clean in art.get("ten_dieu", "").lower()
                match_content = kw_clean in art.get("noi_dung", "").lower()
                if match_kw or match_title or match_content:
                    results.append(art)
            return results

        # Case 4: No filter provided, return all articles
        return cls._raw_articles
