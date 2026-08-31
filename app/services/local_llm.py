import re
import json
import logging
from typing import Dict, Any, Optional
import httpx

from app.schemas.analysis import ExtractedEntitiesSchema

logger = logging.getLogger("uvicorn.error")

LOCAL_LLM_URL = "http://localhost:11434/api/generate"

class LocalLLMService:
    @staticmethod
    async def extract_entities(summary_acts: str) -> ExtractedEntitiesSchema:
        """
        Extracts structured entities from case summary acts using Local LLM.
        If the Local LLM is offline or fails, it falls back to a robust Regex parser.
        """
        if not summary_acts or not summary_acts.strip():
            return ExtractedEntitiesSchema()

        # Attempt to extract using Local LLM
        prompt = (
            "Bạn là Trợ lý AI Pháp lý. Hãy trích xuất thông tin từ văn bản tóm tắt vụ án dưới đây thành một đối tượng JSON có các trường sau:\n"
            "1. suspect_age: Độ tuổi của bị can (số nguyên, null nếu không có).\n"
            "2. objective_behavior: Mô tả hành vi khách quan cốt lõi (chuỗi).\n"
            "3. consequence: Giá trị tài sản bị xâm hại hoặc hậu quả tài chính (số thực tính theo VNĐ, null nếu không có).\n"
            "4. arrest_time: Ngày bị can bị bắt giữ/tạm giữ (định dạng YYYY-MM-DD, null nếu không có).\n"
            "5. weapon: Công cụ, phương tiện hoặc hung khí thực hiện hành vi (chuỗi, null nếu không có).\n\n"
            f"Văn bản tóm tắt vụ án:\n\"{summary_acts}\"\n\n"
            "Trả về DUY NHẤT đối tượng JSON hợp lệ, không thêm bất kỳ chữ giải thích nào."
        )

        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                response = await client.post(
                    LOCAL_LLM_URL,
                    json={
                        "model": "llama3",  # default model or configuration
                        "prompt": prompt,
                        "stream": False,
                        "format": "json"
                    }
                )
                if response.status_code == 200:
                    data = response.json()
                    response_text = data.get("response", "").strip()
                    # Parse the JSON response from the LLM
                    parsed_json = json.loads(response_text)
                    logger.info("LocalLLMService: Entities extracted successfully using Local LLM.")
                    return ExtractedEntitiesSchema(
                        suspect_age=parsed_json.get("suspect_age"),
                        objective_behavior=parsed_json.get("objective_behavior"),
                        consequence=parsed_json.get("consequence"),
                        arrest_time=parsed_json.get("arrest_time"),
                        weapon=parsed_json.get("weapon")
                    )
        except Exception as e:
            logger.warning(f"LocalLLMService: Local LLM API not available ({str(e)}). Falling back to Regex parser.")

        # Fallback to Regex Parser
        return LocalLLMService._regex_extract(summary_acts)

    @staticmethod
    def _regex_extract(text: str) -> ExtractedEntitiesSchema:
        """
        Deterministic extraction using Regex patterns.
        Optimized for Vietnamese legal case summaries.
        """
        text_lower = text.lower()
        
        # 1. Extract Suspect Age
        age = None
        age_match = re.search(r"(\d+)\s*(?:tuổi|t)", text_lower)
        if age_match:
            age = int(age_match.group(1))
        else:
            # Try to find birth year, e.g. "sinh năm 2000"
            year_match = re.search(r"sinh năm\s*(\d{4})", text_lower)
            if year_match:
                birth_year = int(year_match.group(1))
                # Calculate age based on a reference year (e.g. 2026)
                age = 2026 - birth_year

        # 2. Extract Objective Behavior
        behavior = None
        behaviors = []
        if any(kw in text_lower for kw in ["trộm cắp", "lấy trộm", "đột nhập", "cạy cửa"]):
            behaviors.append("trộm cắp tài sản")
        if any(kw in text_lower for kw in ["cướp", "khống chế", "dùng vũ lực"]):
            behaviors.append("cướp tài sản")
        if any(kw in text_lower for kw in ["đe dọa dùng vũ lực", "cưỡng đoạt", "uy hiếp tinh thần"]):
            behaviors.append("cưỡng đoạt tài sản")
        if any(kw in text_lower for kw in ["lừa đảo", "gian dối", "giả mạo"]):
            behaviors.append("lừa đảo chiếm đoạt tài sản")
        if any(kw in text_lower for kw in ["tham ô", "thủ quỹ", "lợi dụng chức vụ"]):
            behaviors.append("tham ô tài sản")
            
        if behaviors:
            behavior = ", ".join(behaviors)
        else:
            # Fallback to a snippet of the text
            behavior = text[:100] + "..." if len(text) > 100 else text

        # 3. Extract Consequence (Monetary damage value)
        consequence = None
        # Try to match plain formatted numbers like "5.000.000" first to avoid dot-separated substring matching
        raw_money_match = re.search(r"(\d{1,3}(?:\.\d{3})+)\s*(?:đồng|vnd|vnđ)?", text_lower)
        if raw_money_match:
            val_str = raw_money_match.group(1).replace(".", "")
            consequence = float(val_str)
        else:
            # Pattern for numeric values followed by million or billion
            money_match = re.search(r"(\d+(?:\.\d+)?)\s*(triệu|tỷ|đồng|vnd|vnđ)", text_lower)
            if money_match:
                value = float(money_match.group(1).replace(",", ""))
                unit = money_match.group(2)
                if "triệu" in unit:
                    consequence = value * 1_000_000
                elif "tỷ" in unit:
                    consequence = value * 1_000_000_000
                else:
                    consequence = value

        # 4. Extract Arrest/Custody Time
        arrest_time = None
        # Pattern for day/month/year e.g., "15/08/2026" or "15-08-2026"
        date_match = re.search(r"ngày\s*(\d{1,2})[/-](\d{1,2})[/-](\d{4})", text_lower)
        if date_match:
            day = date_match.group(1).zfill(2)
            month = date_match.group(2).zfill(2)
            year = date_match.group(3)
            arrest_time = f"{year}-{month}-{day}"
        else:
            # Look for ISO format date
            iso_match = re.search(r"(\d{4})-(\d{2})-(\d{2})", text_lower)
            if iso_match:
                arrest_time = iso_match.group(0)

        # 5. Extract Weapon / Tools
        weapon = None
        weapons = []
        for w in ["dao", "súng", "kiếm", "xe máy", "gậy", "búa", "kìm cộng lực", "xà beng"]:
            if w in text_lower:
                weapons.append(w)
        if weapons:
            weapon = ", ".join(weapons)

        logger.info(f"LocalLLMService: Entities extracted via Regex fallback. Age={age}, Consequence={consequence}, Date={arrest_time}")
        return ExtractedEntitiesSchema(
            suspect_age=age,
            objective_behavior=behavior,
            consequence=consequence,
            arrest_time=arrest_time,
            weapon=weapon
        )
