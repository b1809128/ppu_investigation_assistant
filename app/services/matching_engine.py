import json
import os
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

from app.models.case import CaseFile
from app.models.suspect import Suspect
from app.services.legal_data import LegalDataService

logger = logging.getLogger("uvicorn.error")

# Vietnamese Penal Code 2015 - Damage thresholds for common property & office crimes
# Defined as range [min, max) and classification details.
DAMAGE_THRESHOLDS = {
    173: [  # Tội trộm cắp tài sản
        {"clause": 1, "min": 2000000, "max": 50000000, "max_penalty": 3, "severity": "ÍT_NGHIÊM_TRỌNG", "label": "Khoản 1 (Phạt cải tạo không giam giữ đến 03 năm hoặc phạt tù từ 06 tháng đến 03 năm)"},
        {"clause": 2, "min": 50000000, "max": 200000000, "max_penalty": 7, "severity": "NGHIÊM_TRỌNG", "label": "Khoản 2 (Phạt tù từ 02 năm đến 07 năm)"},
        {"clause": 3, "min": 200000000, "max": 500000000, "max_penalty": 15, "severity": "RẤT_NGHIÊM_TRỌNG", "label": "Khoản 3 (Phạt tù từ 07 năm đến 15 năm)"},
        {"clause": 4, "min": 500000000, "max": float("inf"), "max_penalty": 20, "severity": "ĐẶC_BIỆT_NGHIÊM_TRỌNG", "label": "Khoản 4 (Phạt tù từ 12 năm đến 20 năm hoặc tù chung thân)"}
    ],
    174: [  # Tội lừa đảo chiếm đoạt tài sản
        {"clause": 1, "min": 2000000, "max": 50000000, "max_penalty": 3, "severity": "ÍT_NGHIÊM_TRỌNG", "label": "Khoản 1 (Phạt cải tạo không giam giữ đến 03 năm hoặc phạt tù từ 06 tháng đến 03 năm)"},
        {"clause": 2, "min": 50000000, "max": 200000000, "max_penalty": 7, "severity": "NGHIÊM_TRỌNG", "label": "Khoản 2 (Phạt tù từ 02 năm đến 07 năm)"},
        {"clause": 3, "min": 200000000, "max": 500000000, "max_penalty": 15, "severity": "RẤT_NGHIÊM_TRỌNG", "label": "Khoản 3 (Phạt tù từ 07 năm đến 15 năm)"},
        {"clause": 4, "min": 500000000, "max": float("inf"), "max_penalty": 20, "severity": "ĐẶC_BIỆT_NGHIÊM_TRỌNG", "label": "Khoản 4 (Phạt tù từ 12 năm đến 20 năm hoặc tù chung thân)"}
    ],
    353: [  # Tội tham ô tài sản
        {"clause": 1, "min": 2000000, "max": 100000000, "max_penalty": 7, "severity": "NGHIÊM_TRỌNG", "label": "Khoản 1 (Phạt tù từ 02 năm đến 07 năm)"},
        {"clause": 2, "min": 100000000, "max": 500000000, "max_penalty": 15, "severity": "RẤT_NGHIÊM_TRỌNG", "label": "Khoản 2 (Phạt tù từ 07 năm đến 15 năm)"},
        {"clause": 3, "min": 500000000, "max": 1000000000, "max_penalty": 20, "severity": "ĐẶC_BIỆT_NGHIÊM_TRỌNG", "label": "Khoản 3 (Phạt tù từ 15 năm đến 20 năm)"},
        {"clause": 4, "min": 1000000000, "max": float("inf"), "max_penalty": 30, "severity": "ĐẶC_BIỆT_NGHIÊM_TRỌNG", "label": "Khoản 4 (Phạt tù 20 năm, tù chung thân hoặc tử hình)"}
    ],
    354: [  # Tội nhận hối lộ
        {"clause": 1, "min": 2000000, "max": 100000000, "max_penalty": 7, "severity": "NGHIÊM_TRỌNG", "label": "Khoản 1 (Phạt tù từ 02 năm đến 07 năm)"},
        {"clause": 2, "min": 100000000, "max": 500000000, "max_penalty": 15, "severity": "RẤT_NGHIÊM_TRỌNG", "label": "Khoản 2 (Phạt tù từ 07 năm đến 15 năm)"},
        {"clause": 3, "min": 500000000, "max": 1000000000, "max_penalty": 20, "severity": "ĐẶC_BIỆT_NGHIÊM_TRỌNG", "label": "Khoản 3 (Phạt tù từ 15 năm đến 20 năm)"},
        {"clause": 4, "min": 1000000000, "max": float("inf"), "max_penalty": 30, "severity": "ĐẶC_BIỆT_NGHIÊM_TRỌNG", "label": "Khoản 4 (Phạt tù 20 năm, tù chung thân hoặc tử hình)"}
    ]
}

class MatchingEngine:
    @staticmethod
    def evaluate_criminal_age(suspect_dob: Optional[str], incident_date: Optional[Any]) -> Dict[str, Any]:
        """
        Calculates suspect age at the time of the incident and determines liability according to Article 12.
        """
        if not suspect_dob:
            return {
                "age": None,
                "is_liable": True,
                "status": "Không có thông tin ngày sinh.",
                "details": "Không thể đánh giá độ tuổi chịu TNHS vì thiếu ngày sinh."
            }

        try:
            # Parse dates
            dob_date = datetime.strptime(suspect_dob.strip(), "%Y-%m-%d").date()
            
            if isinstance(incident_date, str):
                parsed_incident = None
                for fmt in ("%Y-%m-%dT%H:%M:%S", "%Y-%m-%d %H:%M:%S", "%Y-%m-%d"):
                    try:
                        parsed_incident = datetime.strptime(incident_date.strip(), fmt).date()
                        break
                    except ValueError:
                        continue
                if not parsed_incident:
                    raise ValueError("Không định dạng được ngày xảy ra vụ việc")
                incident_d = parsed_incident
            elif isinstance(incident_date, datetime):
                incident_d = incident_date.date()
            else:
                incident_d = incident_date if incident_date else datetime.now().date()
            
            # Exact age calculation (years completed)
            age = incident_d.year - dob_date.year
            if (incident_d.month, incident_d.day) < (dob_date.month, dob_date.day):
                age -= 1
                
            if age < 0:
                return {
                    "age": age,
                    "is_liable": False,
                    "status": "Lỗi dữ liệu: Ngày sinh lớn hơn ngày xảy ra vụ án.",
                    "details": f"Ngày sinh ({suspect_dob}) lớn hơn ngày xảy ra vụ việc ({incident_d})."
                }

            # Age evaluation rules according to Article 12 BLHS
            if age < 14:
                return {
                    "age": age,
                    "is_liable": False,
                    "status": "Chưa đủ tuổi chịu TNHS (Dưới 14 tuổi).",
                    "details": "Căn cứ Điều 12 BLHS: Người dưới 14 tuổi chưa đủ tuổi chịu trách nhiệm hình sự trong mọi trường hợp."
                }
            elif 14 <= age < 16:
                return {
                    "age": age,
                    "is_liable": True,
                    "status": "Từ đủ 14 đến dưới 16 tuổi. Chịu TNHS giới hạn.",
                    "details": "Căn cứ Khoản 2 Điều 12 BLHS: Người từ đủ 14 đến dưới 16 tuổi chỉ chịu trách nhiệm hình sự về tội phạm rất nghiêm trọng hoặc đặc biệt nghiêm trọng cố ý thuộc một số Điều luật được quy định cụ thể (bao gồm Điều 134, 173, 174, 353, 354, v.v.). Không chịu TNHS đối với tội phạm ít nghiêm trọng hoặc nghiêm trọng."
                }
            else:
                return {
                    "age": age,
                    "is_liable": True,
                    "status": "Đủ tuổi chịu TNHS đầy đủ (Từ đủ 16 tuổi trở lên).",
                    "details": "Căn cứ Khoản 1 Điều 12 BLHS: Người từ đủ 16 tuổi trở lên phải chịu trách nhiệm hình sự về mọi tội phạm."
                }

        except Exception as e:
            logger.error(f"Lỗi tính tuổi hình sự: {str(e)}")
            return {
                "age": None,
                "is_liable": True,
                "status": f"Lỗi định dạng ngày: {str(e)}",
                "details": "Vui lòng nhập ngày sinh theo định dạng chuẩn YYYY-MM-DD."
            }

    @staticmethod
    def evaluate_damage_thresholds(damage_value: Optional[float], article_id: int) -> Dict[str, Any]:
        """
        Determines the applicable clause and crime severity based on damage value.
        """
        # Default fallback if no thresholds defined for this article
        if article_id not in DAMAGE_THRESHOLDS:
            return {
                "has_thresholds": False,
                "applicable_clause": 1,
                "severity": "ÍT_NGHIÊM_TRỌNG",
                "label": "Khoản 1 (Định khung cơ bản - chưa cấu hình định lượng tiền)",
                "warning": None
            }

        val = damage_value if damage_value is not None else 0.0
        rules = DAMAGE_THRESHOLDS[article_id]
        
        # 1. Under 2,000,000 Special Condition check (for 173, 174, 353, 354)
        if val < 2000000:
            return {
                "has_thresholds": True,
                "applicable_clause": 1,
                "severity": "ÍT_NGHIÊM_TRỌNG",
                "label": "Khoản 1 (Cần xem xét điều kiện bổ sung)",
                "warning": f"Giá trị tài sản ({val:,.0f} VNĐ) dưới 2.000.000 VNĐ. Bị can chỉ bị truy cứu trách nhiệm hình sự nếu đã bị xử phạt hành chính về hành vi chiếm đoạt, đã bị kết án về tội xâm phạm sở hữu chưa được xóa án tích, gây ảnh hưởng xấu đến an ninh, trật tự xã hội hoặc tài sản là phương tiện kiếm sống chính."
            }

        # 2. Threshold checks
        for rule in rules:
            if rule["min"] <= val < rule["max"]:
                return {
                    "has_thresholds": True,
                    "applicable_clause": rule["clause"],
                    "severity": rule["severity"],
                    "label": rule["label"],
                    "warning": None
                }

        # Fallback for inf
        return {
            "has_thresholds": True,
            "applicable_clause": 4,
            "severity": "ĐẶC_BIỆT_NGHIÊM_TRỌNG",
            "label": rules[-1]["label"],
            "warning": None
        }

    @staticmethod
    def check_recidivism(prior_convictions: Optional[str]) -> Dict[str, Any]:
        """
        Checks for potential recidivism/dangerous recidivism based on keyword analysis of prior convictions.
        """
        if not prior_convictions or not prior_convictions.strip():
            return {
                "has_warning": False,
                "level": "NONE",
                "message": "Không ghi nhận tiền án.",
                "guideline": ""
            }

        text_lower = prior_convictions.lower()

        # Check dangerous recidivism first
        if any(kw in text_lower for kw in ["tái phạm nguy hiểm", "nguy hiểm"]):
            return {
                "has_warning": True,
                "level": "DANGEROUS",
                "message": "Cảnh báo: Tái phạm nguy hiểm (Điều 53 Khoản 2 BLHS).",
                "guideline": "Căn cứ Điều 53 Khoản 2 BLHS: Gợi ý áp dụng tình tiết định khung tăng nặng tương ứng hoặc tình tiết định khung tăng nặng có sẵn của điều luật."
            }

        # Check normal recidivism
        if any(kw in text_lower for kw in ["tiền án", "chưa được xóa án tích", "chưa xóa án tích", "đã bị kết án", "tái phạm"]):
            return {
                "has_warning": True,
                "level": "NORMAL",
                "message": "Cảnh báo: Tái phạm (Điều 53 Khoản 1 BLHS).",
                "guideline": "Căn cứ Điều 53 Khoản 1 BLHS: Đề nghị xem xét tình tiết tăng nặng trách nhiệm hình sự (Điều 52 Khoản 1 Điểm g BLHS - Tái phạm)."
            }

        return {
            "has_warning": False,
            "level": "NONE",
            "message": f"Ghi nhận tiền sự / thông tin khác: '{prior_convictions}'",
            "guideline": "Xác minh xem tiền sự này có thuộc hành vi cấu thành tội phạm hoặc đã hết thời hiệu xóa án tích hay chưa."
        }

    @classmethod
    def evaluate_case(cls, db: Session, case_id: int) -> Dict[str, Any]:
        """
        Core logic to compile and match a case file against the Penal Code.
        Generates structured evaluations for each suspect and article matches.
        """
        case = db.query(CaseFile).filter(CaseFile.id == case_id).first()
        if not case:
            return {"error": "Không tìm thấy hồ sơ vụ án."}

        # 1. Match case summary/acts to Penal Code articles via keyword matching
        matched_articles = []
        summary_lower = (case.summary_acts or "").lower()
        
        # Load database if not loaded
        if not LegalDataService._raw_articles:
            # Fallback to loading database path if empty
            from app.core.config import settings
            LegalDataService.load_database(settings.LEGAL_DB_PATH)

        for article in LegalDataService._raw_articles:
            # Match keywords
            matched_kws = [
                kw for kw in article.get("keywords", [])
                if kw.lower() in summary_lower
            ]
            if matched_kws:
                matched_articles.append({
                    "article_id": article["dieu"],
                    "title": article["ten_dieu"],
                    "matched_keywords": matched_kws,
                    "noi_dung": article["noi_dung"],
                    "chuong": article["chuong"]
                })

        # 2. Evaluate each suspect
        suspects = db.query(Suspect).filter(Suspect.case_id == case_id).all()
        suspect_evaluations = []

        for suspect in suspects:
            # Evaluate Age
            age_eval = cls.evaluate_criminal_age(suspect.dob, case.incident_date)
            # Evaluate Recidivism
            recidivism_eval = cls.check_recidivism(suspect.prior_convictions)
            
            # Combine matched articles evaluation for this suspect
            article_suggestions = []
            
            for art in matched_articles:
                art_id = art["article_id"]
                # Run damage threshold check
                damage_eval = cls.evaluate_damage_thresholds(case.damage_value, art_id)
                
                # Verify age-based liability for this specific article & clause
                # Rules for 14-16 age group:
                suspect_is_liable = True
                liability_note = "Đủ điều kiện chịu trách nhiệm hình sự."
                
                if age_eval["age"] is not None:
                    if age_eval["age"] < 14:
                        suspect_is_liable = False
                        liability_note = "Bị can dưới 14 tuổi, không chịu TNHS."
                    elif 14 <= age_eval["age"] < 16:
                        # Designated articles check under Clause 2 Article 12 BLHS
                        # Check if article is in list and severity is RẤT_NGHIÊM_TRỌNG or ĐẶC_BIỆT_NGHIÊM_TRỌNG
                        designated_articles = [134, 173, 174, 353, 354]  # common crimes matching our DB
                        
                        if art_id not in designated_articles:
                            suspect_is_liable = False
                            liability_note = f"Người từ đủ 14 đến dưới 16 tuổi KHÔNG chịu TNHS đối với Tội quy định tại Điều {art_id} (chỉ chịu đối với danh mục chỉ định)."
                        else:
                            # Must be very serious (rất nghiêm trọng) or extremely serious (đặc biệt nghiêm trọng)
                            if damage_eval["severity"] not in ["RẤT_NGHIÊM_TRỌNG", "ĐẶC_BIỆT_NGHIÊM_TRỌNG"]:
                                suspect_is_liable = False
                                liability_note = f"Điều luật {art_id} định khung ở mức {damage_eval['severity']}. Bị can từ đủ 14 đến dưới 16 tuổi chỉ chịu TNHS về tội rất nghiêm trọng hoặc đặc biệt nghiêm trọng (mức tối đa khung hình phạt trên 7 năm tù)."
                            else:
                                liability_note = f"Bị can từ đủ 14 đến dưới 16 tuổi chịu TNHS do tội này định khung ở mức {damage_eval['severity']} (Khoản {damage_eval['applicable_clause']})."

                article_suggestions.append({
                    "article_id": art_id,
                    "title": art["title"],
                    "applicable_clause": damage_eval["applicable_clause"],
                    "severity": damage_eval["severity"],
                    "clause_details": damage_eval["label"],
                    "damage_warning": damage_eval["warning"],
                    "suspect_is_liable": suspect_is_liable,
                    "liability_note": liability_note
                })

            suspect_evaluations.append({
                "suspect_id": suspect.id,
                "full_name": suspect.full_name,
                "dob": suspect.dob,
                "age": age_eval["age"],
                "age_status": age_eval["status"],
                "age_details": age_eval["details"],
                "recidivism": recidivism_eval,
                "article_suggestions": article_suggestions
            })

        # 3. Rule Engine: Procedural checklist and warnings
        warnings = []
        checklist = {
            "Quyết định khởi tố vụ án hình sự": False,
            "Quyết định khởi tố bị can": False,
            "Biên bản khám nghiệm hiện trường": False,
            "Biên bản hỏi cung bị can": False
        }
        
        for doc in case.documents:
            doc_type = doc.document_type
            if doc_type in checklist:
                checklist[doc_type] = True
                
        if suspects and not checklist["Quyết định khởi tố vụ án hình sự"]:
            warnings.append({
                "severity": "CRITICAL",
                "message": "Cảnh báo nghiêm trọng: Hồ sơ vụ việc đã ghi nhận đối tượng bị can thụ lý nhưng chưa bổ sung Quyết định khởi tố vụ án hình sự."
            })
            
        interrogations_present = any(doc.document_type == "Biên bản hỏi cung bị can" for doc in case.documents)
        if interrogations_present and not checklist["Quyết định khởi tố bị can"]:
            warnings.append({
                "severity": "WARNING",
                "message": "Cảnh báo nghiệp vụ: Đã lập Biên bản hỏi cung bị can nhưng hồ sơ chưa có Quyết định khởi tố bị can."
            })

        custody_doc = next((doc for doc in case.documents if doc.document_type == "Quyết định tạm giữ"), None)
        if custody_doc:
            days_in_custody = (datetime.now() - case.created_at).days
            if days_in_custody >= 3 and not checklist["Quyết định khởi tố bị can"]:
                warnings.append({
                    "severity": "CRITICAL",
                    "message": f"Cảnh báo khẩn cấp: Đã áp dụng biện pháp Tạm giữ (quá thời hạn 3 ngày quy định tại Điều 110 BLTTHS) nhưng chưa có Quyết định khởi tố bị can."
                })

        # Compile report
        return {
            "id": case.id,
            "case_id": case.id,
            "case_code": case.case_code,
            "case_name": case.case_name,
            "incident_date": case.incident_date,
            "location": case.location,
            "damage_value": case.damage_value,
            "summary_acts": case.summary_acts,
            "matched_articles_count": len(matched_articles),
            "matched_articles": matched_articles,
            "suspects_count": len(suspects),
            "evaluations": suspect_evaluations,
            "procedural_checklist": checklist,
            "procedural_warnings": warnings
        }
