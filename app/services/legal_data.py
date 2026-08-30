import json
import os
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger("uvicorn.error")

class LegalDataService:
    # Raw items read from JSON file (Penal Code)
    _raw_articles: List[Dict[str, Any]] = []
    _articles_by_id: Dict[int, Dict[str, Any]] = {}
    _articles_by_chapter: Dict[str, List[Dict[str, Any]]] = {}
    _articles_by_keyword: Dict[str, List[Dict[str, Any]]] = {}

    # Criminal Procedure Code items
    _procedure_articles: List[Dict[str, Any]] = []
    _procedure_by_id: Dict[int, Dict[str, Any]] = {}
    _procedure_by_chapter: Dict[str, List[Dict[str, Any]]] = {}
    _procedure_by_keyword: Dict[str, List[Dict[str, Any]]] = {}

    @classmethod
    def load_database(cls, filepath: str) -> None:
        """
        Loads the Penal Code JSON file into memory and builds O(1) search indexes.
        """
        if not os.path.exists(filepath):
            logger.error(f"LegalDataService: Tệp dữ liệu luật không tồn tại tại: {filepath}")
            return

        try:
            with open(filepath, "r", encoding="utf-8") as f:
                cls._raw_articles = json.load(f)

            cls._articles_by_id = {}
            cls._articles_by_chapter = {}
            cls._articles_by_keyword = {}

            for article in cls._raw_articles:
                art_id = article.get("dieu")
                if art_id is not None:
                    cls._articles_by_id[int(art_id)] = article

                chap_id = article.get("chuong")
                if chap_id:
                    if chap_id not in cls._articles_by_chapter:
                        cls._articles_by_chapter[chap_id] = []
                    cls._articles_by_chapter[chap_id].append(article)

                keywords = article.get("keywords", [])
                for kw in keywords:
                    kw_clean = kw.strip().lower()
                    if kw_clean:
                        if kw_clean not in cls._articles_by_keyword:
                            cls._articles_by_keyword[kw_clean] = []
                        if article not in cls._articles_by_keyword[kw_clean]:
                            cls._articles_by_keyword[kw_clean].append(article)

            logger.info(f"LegalDataService: Đã tải và lập chỉ mục {len(cls._raw_articles)} điều luật Hình sự thành công.")
        except Exception as e:
            logger.error(f"LegalDataService: Lỗi khi tải tệp luật hình sự: {str(e)}")

    @classmethod
    def load_procedure_database(cls, filepath: str) -> None:
        """
        Loads the Code of Criminal Procedure JSON file into memory and indexes it.
        """
        if not os.path.exists(filepath):
            logger.error(f"LegalDataService: Tệp tố tụng không tồn tại tại: {filepath}")
            return

        try:
            with open(filepath, "r", encoding="utf-8") as f:
                cls._procedure_articles = json.load(f)

            cls._procedure_by_id = {}
            cls._procedure_by_chapter = {}
            cls._procedure_by_keyword = {}

            for article in cls._procedure_articles:
                art_id = article.get("dieu")
                if art_id is not None:
                    cls._procedure_by_id[int(art_id)] = article

                chap_id = article.get("chuong")
                if chap_id:
                    if chap_id not in cls._procedure_by_chapter:
                        cls._procedure_by_chapter[chap_id] = []
                    cls._procedure_by_chapter[chap_id].append(article)

                keywords = article.get("keywords", [])
                for kw in keywords:
                    kw_clean = kw.strip().lower()
                    if kw_clean:
                        if kw_clean not in cls._procedure_by_keyword:
                            cls._procedure_by_keyword[kw_clean] = []
                        if article not in cls._procedure_by_keyword[kw_clean]:
                            cls._procedure_by_keyword[kw_clean].append(article)

            logger.info(f"LegalDataService: Đã tải và lập chỉ mục {len(cls._procedure_articles)} điều luật Tố tụng thành công.")
        except Exception as e:
            logger.error(f"LegalDataService: Lỗi khi tải tệp luật tố tụng: {str(e)}")

    @classmethod
    def clear(cls) -> None:
        """Clears all raw data and indexes."""
        cls._raw_articles = []
        cls._articles_by_id = {}
        cls._articles_by_chapter = {}
        cls._articles_by_keyword = {}
        cls._procedure_articles = []
        cls._procedure_by_id = {}
        cls._procedure_by_chapter = {}
        cls._procedure_by_keyword = {}

    @classmethod
    def search(
        cls,
        behavior_keyword: Optional[str] = None,
        article_id: Optional[int] = None,
        chapter_id: Optional[str] = None,
        law_type: str = "penal"
    ) -> List[Dict[str, Any]]:
        """
        Search articles using O(1) in-memory indexes.
        Supports searching either 'penal' (BLHS) or 'procedure' (BLTTHS).
        """
        # Select active indexes based on law_type
        if law_type == "procedure":
            raw_list = cls._procedure_articles
            id_index = cls._procedure_by_id
            chap_index = cls._procedure_by_chapter
            kw_index = cls._procedure_by_keyword
        else:
            raw_list = cls._raw_articles
            id_index = cls._articles_by_id
            chap_index = cls._articles_by_chapter
            kw_index = cls._articles_by_keyword

        # Case 1: Search by exact article_id (dieu) -> returns at most 1 article
        if article_id is not None:
            art = id_index.get(article_id)
            return [art] if art else []

        # Case 2: Search by chapter_id (chuong)
        if chapter_id is not None:
            results = chap_index.get(chapter_id, [])
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
            exact_matches = kw_index.get(kw_clean, [])
            if exact_matches:
                return exact_matches

            # Fallback to substring matching across all fields for usability/flexibility
            results = []
            for art in raw_list:
                match_kw = any(kw_clean in k.lower() for k in art.get("keywords", []))
                match_title = kw_clean in art.get("ten_dieu", "").lower()
                match_content = kw_clean in art.get("noi_dung", "").lower()
                if match_kw or match_title or match_content:
                    results.append(art)
            return results

        # Case 4: No filter provided, return all articles
        return raw_list
