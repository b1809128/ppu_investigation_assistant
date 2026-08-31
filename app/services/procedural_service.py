import logging
from datetime import datetime, date
from typing import List, Dict, Any, Optional

from app.models.case import CaseFile
from app.schemas.analysis import ExtractedEntitiesSchema, ProceduralWarningSchema, SuggestedChargeSchema

logger = logging.getLogger("uvicorn.error")

class ProceduralService:
    @staticmethod
    def analyze_timeline(
        case: CaseFile, 
        entities: ExtractedEntitiesSchema,
        suggested_charges: List[SuggestedChargeSchema]
    ) -> List[ProceduralWarningSchema]:
        """
        Calculates and checks procedural timeline milestones from case documents and extracted entities.
        Verifies custody limits (Article 118) and detention milestones (Article 119/173).
        """
        warnings: List[ProceduralWarningSchema] = []

        arrest_date_str = entities.arrest_time
        if not arrest_date_str:
            # Try to look for a mock arrest log or document
            warnings.append(ProceduralWarningSchema(
                severity="INFO",
                message="Chưa ghi nhận ngày bắt giữ/tạm giữ của bị can trong văn bản. Vui lòng cập nhật thông tin để hệ thống tự động kiểm soát thời hạn tố tụng.",
                article_reference="Điều 110 BLTTHS"
            ))
            return warnings

        try:
            # Parse arrest date
            arrest_date = datetime.strptime(arrest_date_str, "%Y-%m-%d").date()
            current_date = date.today()
            days_held = (current_date - arrest_date).days
        except Exception as e:
            logger.error(f"ProceduralService: Lỗi định dạng ngày bắt giữ '{arrest_date_str}': {str(e)}")
            return warnings

        # 1. Custody Check (Tạm giữ - Điều 118 BLTTHS)
        # Check case documents for custody extension or detention approvals
        has_extension_1 = False
        has_extension_2 = False
        has_detention_order = False

        for doc in case.documents:
            doc_name = (doc.name or "").lower()
            doc_type = (doc.document_type or "").lower()
            if "gia hạn tạm giữ" in doc_name or "gia hạn tạm giữ" in doc_type:
                if "lần 2" in doc_name or "lần hai" in doc_name:
                    has_extension_2 = True
                else:
                    has_extension_1 = True
            if "tạm giam" in doc_name or "tạm giam" in doc_type:
                has_detention_order = True

        # If not yet under detention order, evaluate custody limits
        if not has_detention_order:
            if days_held > 9:
                warnings.append(ProceduralWarningSchema(
                    severity="CRITICAL",
                    message=f"VI PHẠM THỦ TỤC NGHIÊM TRỌNG: Bị can đã bị tạm giữ {days_held} ngày kể từ ngày {arrest_date_str}. Vượt quá tổng giới hạn tạm giữ tối đa 09 ngày.",
                    article_reference="Điều 118 Khoản 2 BLTTHS"
                ))
            elif days_held > 6 and not has_extension_2:
                warnings.append(ProceduralWarningSchema(
                    severity="CRITICAL",
                    message=f"CẢNH BÁO KHẨN CẤP: Đã tạm giữ {days_held} ngày kể từ ngày {arrest_date_str}. Vượt quá thời hạn gia hạn lần 1 (06 ngày). Cần lập tức trình Viện kiểm sát phê chuẩn Gia hạn tạm giữ lần 2 hoặc Khởi tố bị can, ra Lệnh tạm giam.",
                    article_reference="Điều 118 Khoản 2 BLTTHS"
                ))
            elif days_held > 3 and not has_extension_1:
                warnings.append(ProceduralWarningSchema(
                    severity="CRITICAL",
                    message=f"CẢNH BÁO KHẨN CẤP: Đã quá thời hạn tạm giữ ban đầu 03 ngày (Hiện tại: {days_held} ngày). Yêu cầu bổ sung Quyết định gia hạn tạm giữ lần 1 hoặc ra Quyết định khởi tố bị can, chuyển sang tạm giam.",
                    article_reference="Điều 118 Khoản 1 BLTTHS"
                ))
            else:
                warnings.append(ProceduralWarningSchema(
                    severity="WARNING",
                    message=f"Bị can đang bị tạm giữ ngày thứ {days_held}. Thời hạn tạm giữ ban đầu còn {3 - days_held} ngày. Lưu ý chuẩn bị thủ tục gia hạn hoặc khởi tố trước thời điểm hết hạn.",
                    article_reference="Điều 118 BLTTHS"
                ))

        # 2. Detention Milestones (Tạm giam - Điều 119 & 173 BLTTHS)
        # Determine case severity based on suggested charges
        max_severity = "ÍT_NGHIÊM_TRỌNG"
        severity_label = "Tội ít nghiêm trọng"
        detention_limit_months = 2

        for charge in suggested_charges:
            # Map severity based on clauses
            clause = charge.applicable_clause
            dieu_no = charge.article_id
            
            # Simple severity estimation logic
            if dieu_no in [168, 170, 173, 174, 175]:
                if clause == 4:
                    max_severity = "ĐẶC_BIỆT_NGHIÊM_TRỌNG"
                    severity_label = "Tội đặc biệt nghiêm trọng"
                    detention_limit_months = 4
                elif clause == 3:
                    if max_severity not in ["ĐẶC_BIỆT_NGHIÊM_TRỌNG"]:
                        max_severity = "RẤT_NGHIÊM_TRỌNG"
                        severity_label = "Tội rất nghiêm trọng"
                        detention_limit_months = 4
                elif clause == 2:
                    if max_severity not in ["ĐẶC_BIỆT_NGHIÊM_TRỌNG", "RẤT_NGHIÊM_TRỌNG"]:
                        max_severity = "NGHIÊM_TRỌNG"
                        severity_label = "Tội nghiêm trọng"
                        detention_limit_months = 3

        if has_detention_order:
            warnings.append(ProceduralWarningSchema(
                severity="INFO",
                message=f"Bị can đang áp dụng biện pháp ngăn chặn Tạm giam. Tội danh đề xuất thuộc nhóm '{severity_label}'. "
                        f"Thời hạn tạm giam điều tra tối đa là không quá {detention_limit_months} tháng.",
                article_reference="Điều 173 Khoản 1 BLTTHS"
            ))
            
            # If detention is active, remind of extension limits
            if max_severity == "ÍT_NGHIÊM_TRỌNG":
                warnings.append(ProceduralWarningSchema(
                    severity="WARNING",
                    message="Đối với tội ít nghiêm trọng, chỉ được gia hạn tạm giam 01 lần không quá 01 tháng.",
                    article_reference="Điều 173 Khoản 2 Điểm a BLTTHS"
                ))
            elif max_severity == "NGHIÊM_TRỌNG":
                warnings.append(ProceduralWarningSchema(
                    severity="WARNING",
                    message="Đối với tội nghiêm trọng, chỉ được gia hạn tạm giam 01 lần không quá 02 tháng.",
                    article_reference="Điều 173 Khoản 2 Điểm b BLTTHS"
                ))
            elif max_severity in ["RẤT_NGHIÊM_TRỌNG", "ĐẶC_BIỆT_NGHIÊM_TRỌNG"]:
                warnings.append(ProceduralWarningSchema(
                    severity="WARNING",
                    message="Đối với tội rất/đặc biệt nghiêm trọng, có thể gia hạn lần 1 (không quá 03 tháng) và lần 2 (không quá 02 tháng/03 tháng).",
                    article_reference="Điều 173 Khoản 2/3 BLTTHS"
                ))

        return warnings
