import logging
from datetime import datetime, date
from typing import List, Dict, Any, Optional, Union

from app.models.case import CaseFile
from app.schemas.analysis import ExtractedEntitiesSchema, ProceduralWarningSchema, SuggestedChargeSchema
from app.schemas.procedural import ProceduralCheckResult

logger = logging.getLogger("uvicorn.error")


def _parse_date(date_val: Union[date, datetime, str]) -> date:
    """Helper function to parse date, datetime, or date strings into a standard datetime.date."""
    if isinstance(date_val, datetime):
        return date_val.date()
    if isinstance(date_val, date):
        return date_val
    if isinstance(date_val, str):
        clean_str = date_val.strip()
        for fmt in ("%Y-%m-%d", "%Y-%m-%d %H:%M:%S", "%d/%m/%Y", "%Y/%m/%d"):
            try:
                return datetime.strptime(clean_str, fmt).date()
            except ValueError:
                continue
    raise ValueError(f"Không thể định dạng ngày từ dữ liệu đầu vào: {date_val}")


def check_detention_timeline(
    arrest_date: Union[date, datetime, str],
    extensions_count: int = 0,
    vks_approval: bool = False,
    current_date: Optional[Union[date, datetime, str]] = None
) -> ProceduralCheckResult:
    """
    Kiểm tra thời hạn Tạm giữ theo Điều 118 Bộ luật Tố tụng Hình sự 2015.
    
    Quy định:
    - Tạm giữ ban đầu: tối đa 03 ngày (72 giờ).
    - Gia hạn Lần 1: tối đa +03 ngày (tổng 06 ngày), bắt buộc phải có Phê chuẩn VKS.
    - Gia hạn Lần 2: tối đa +03 ngày (tổng 09 ngày), bắt buộc phải có Phê chuẩn VKS.
    - Tổng thời hạn tạm giữ tối đa: 09 ngày.
    
    Yêu cầu đặc thù:
    - Bắt buộc cảnh báo 'CRITICAL' nếu quá 03 ngày mà không có phê chuẩn VKS (vks_approval=False).
    """
    parsed_arrest_date = _parse_date(arrest_date)
    parsed_current_date = _parse_date(current_date) if current_date else date.today()
    
    days_elapsed = (parsed_current_date - parsed_arrest_date).days
    
    # 1. Kiểm tra điều kiện bắt buộc: Quá 3 ngày mà không có Phê chuẩn VKS
    if days_elapsed > 3 and not vks_approval:
        days_remaining = 3 - days_elapsed
        return ProceduralCheckResult(
            status="CRITICAL",
            days_remaining=days_remaining,
            days_elapsed=days_elapsed,
            max_days=3,
            recommendation=(
                f"CẢNH BÁO CRITICAL: Bị can đã bị tạm giữ {days_elapsed} ngày nhưng CHƯA CÓ PHÊ CHUẨN VKS. "
                f"Đã quá thời hạn tạm giữ ban đầu 03 ngày. Yêu cầu lập tức xin Phê chuẩn Gia hạn tạm giữ "
                f"hoặc ra Quyết định khởi tố/trả tự do ngay lập tức theo Điều 118 BLTTHS."
            ),
            article_reference="Điều 118 Khoản 1 & Khoản 2 BLTTHS"
        )
    
    # 2. Xác định max_days dựa trên gia hạn và phê chuẩn VKS
    if not vks_approval:
        max_days = 3
    else:
        if extensions_count <= 1:
            max_days = 6  # 3 ngày đầu + 3 ngày gia hạn lần 1
        else:
            max_days = 9  # 3 ngày đầu + 3 ngày gia hạn lần 1 + 3 ngày gia hạn lần 2
            
    days_remaining = max_days - days_elapsed
    
    # 3. Đánh giá trạng thái
    if days_elapsed > max_days:
        status = "CRITICAL"
        recommendation = (
            f"CẢNH BÁO CRITICAL: Quá thời hạn tạm giữ được phép ({days_elapsed}/{max_days} ngày). "
            f"Vi phạm thủ tục tố tụng nghiêm trọng theo Điều 118 BLTTHS. Yêu cầu khởi tố tạm giam hoặc trả tự do ngay."
        )
    elif days_elapsed > 9:
        status = "CRITICAL"
        recommendation = (
            f"CẢNH BÁO CRITICAL: Đã vượt quá tổng giới hạn tạm giữ tối đa 09 ngày quy định tại Điều 118 BLTTHS. "
            f"Yêu cầu chuyển sang tạm giam hoặc phát lệnh trả tự do lập tức."
        )
    elif days_remaining <= 1:
        status = "WARNING"
        recommendation = (
            f"CẢNH BÁO: Thời hạn tạm giữ sắp hết (đã qua {days_elapsed} ngày, còn {days_remaining} ngày / tối đa {max_days} ngày). "
            f"Khẩn trương hoàn tất thủ tục trình VKS phê chuẩn gia hạn hoặc ra quyết định khởi tố bị can, tạm giam."
        )
    else:
        status = "NORMAL"
        recommendation = (
            f"THỜI HẠN HỢP LỆ: Bị can đang bị tạm giữ ngày thứ {days_elapsed} (còn {days_remaining} ngày trong hạn cho phép {max_days} ngày)."
        )
        
    return ProceduralCheckResult(
        status=status,
        days_remaining=days_remaining,
        days_elapsed=days_elapsed,
        max_days=max_days,
        recommendation=recommendation,
        article_reference="Điều 118 BLTTHS"
    )


def check_custody_limit(
    crime_severity: str,
    custody_start_date: Union[date, datetime, str],
    current_date: Optional[Union[date, datetime, str]] = None
) -> ProceduralCheckResult:
    """
    Tính hạn Tạm giam điều tra theo Điều 119 & Điều 173 Bộ luật Tố tụng Hình sự 2015.
    
    Thời hạn tạm giam điều tra ban đầu:
    - Tội ít nghiêm trọng: không quá 02 tháng (~60 ngày).
    - Tội nghiêm trọng: không quá 03 tháng (~90 ngày).
    - Tội rất nghiêm trọng: không quá 04 tháng (~120 ngày).
    - Tội đặc biệt nghiêm trọng: không quá 04 tháng (~120 ngày, có thể gia hạn).
    """
    parsed_start_date = _parse_date(custody_start_date)
    parsed_current_date = _parse_date(current_date) if current_date else date.today()
    
    days_elapsed = (parsed_current_date - parsed_start_date).days
    
    clean_sev = crime_severity.upper().strip().replace("_", " ")
    
    # Check severity from most specific to general
    if "ĐẶC BIỆT" in clean_sev or "DAC BIET" in clean_sev or "PARTICULARLY" in clean_sev:
        max_months = 4
        max_days = 120
        sev_label = "Tội đặc biệt nghiêm trọng"
    elif "RẤT" in clean_sev or "RAT" in clean_sev or "VERY" in clean_sev:
        max_months = 4
        max_days = 120
        sev_label = "Tội rất nghiêm trọng"
    elif "ÍT" in clean_sev or "IT" in clean_sev or "LESS" in clean_sev or "MINOR" in clean_sev:
        max_months = 2
        max_days = 60
        sev_label = "Tội ít nghiêm trọng"
    elif "NGHIÊM TRỌNG" in clean_sev or "NGHIEM TRONG" in clean_sev or "SERIOUS" in clean_sev:
        max_months = 3
        max_days = 90
        sev_label = "Tội nghiêm trọng"
    else:
        max_months = 2
        max_days = 60
        sev_label = f"Phân loại '{crime_severity}'"
        
    days_remaining = max_days - days_elapsed
    
    if days_remaining < 0:
        status = "CRITICAL"
        recommendation = (
            f"CẢNH BÁO CRITICAL: Đã quá thời hạn tạm giam điều tra ban đầu ({days_elapsed} ngày / tối đa {max_days} ngày ~ {max_months} tháng) "
            f"cho nhóm '{sev_label}'. Yêu cầu làm thủ tục xin gia hạn tạm giam gửi VKS hoặc thay đổi biện pháp ngăn chặn ngay."
        )
    elif days_remaining <= 15:
        status = "WARNING"
        recommendation = (
            f"CẢNH BÁO: Thời hạn tạm giam điều tra sắp hết (đã qua {days_elapsed} ngày, còn {days_remaining} ngày / tối đa {max_days} ngày ~ {max_months} tháng) "
            f"cho nhóm '{sev_label}'. Cần khẩn trương hoàn tất kết luận điều tra hoặc trình VKS xin gia hạn tạm giam."
        )
    else:
        status = "NORMAL"
        recommendation = (
            f"THỜI HẠN HỢP LỆ: Tạm giam điều tra được {days_elapsed} ngày (còn {days_remaining} ngày / tối đa {max_days} ngày ~ {max_months} tháng) "
            f"thuộc nhóm '{sev_label}'."
        )
        
    return ProceduralCheckResult(
        status=status,
        days_remaining=days_remaining,
        days_elapsed=days_elapsed,
        max_days=max_days,
        recommendation=recommendation,
        article_reference="Điều 119 & Điều 173 BLTTHS"
    )


class ProceduralService:
    """
    Procedural inspection service enforcing Vietnam Criminal Procedure Code guidelines.
    """
    check_detention_timeline = staticmethod(check_detention_timeline)
    check_custody_limit = staticmethod(check_custody_limit)

    @staticmethod
    def analyze_timeline(
        case: CaseFile, 
        entities: ExtractedEntitiesSchema,
        suggested_charges: List[SuggestedChargeSchema]
    ) -> List[ProceduralWarningSchema]:
        """
        Calculates and checks procedural timeline milestones from case documents and extracted entities.
        Verifies custody limits (Article 118) and detention milestones (Article 119/173).
        Retained for system backwards compatibility.
        """
        warnings: List[ProceduralWarningSchema] = []

        arrest_date_str = entities.arrest_time
        if not arrest_date_str:
            warnings.append(ProceduralWarningSchema(
                severity="INFO",
                message="Chưa ghi nhận ngày bắt giữ/tạm giữ của bị can trong văn bản. Vui lòng cập nhật thông tin để hệ thống tự động kiểm soát thời hạn tố tụng.",
                article_reference="Điều 110 BLTTHS"
            ))
            return warnings

        try:
            arrest_date = _parse_date(arrest_date_str)
            current_date = date.today()
            days_held = (current_date - arrest_date).days
        except Exception as e:
            logger.error(f"ProceduralService: Lỗi định dạng ngày bắt giữ '{arrest_date_str}': {str(e)}")
            return warnings

        # 1. Custody Check (Tạm giữ - Điều 118 BLTTHS)
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

        if not has_detention_order:
            ext_count = 2 if has_extension_2 else (1 if has_extension_1 else 0)
            vks_app = has_extension_1 or has_extension_2
            res = check_detention_timeline(
                arrest_date=arrest_date,
                extensions_count=ext_count,
                vks_approval=vks_app,
                current_date=current_date
            )
            warnings.append(ProceduralWarningSchema(
                severity=res.status,
                message=res.recommendation,
                article_reference=res.article_reference or "Điều 118 BLTTHS"
            ))

        # 2. Detention Milestones (Tạm giam - Điều 119 & 173 BLTTHS)
        max_severity = "ÍT_NGHIÊM_TRỌNG"
        for charge in suggested_charges:
            clause = charge.applicable_clause
            dieu_no = charge.article_id
            
            if dieu_no in [168, 170, 173, 174, 175]:
                if clause == 4:
                    max_severity = "ĐẶC_BIỆT_NGHIÊM_TRỌNG"
                elif clause == 3 and max_severity not in ["ĐẶC_BIỆT_NGHIÊM_TRỌNG"]:
                    max_severity = "RẤT_NGHIÊM_TRỌNG"
                elif clause == 2 and max_severity not in ["ĐẶC_BIỆT_NGHIÊM_TRỌNG", "RẤT_NGHIÊM_TRỌNG"]:
                    max_severity = "NGHIÊM_TRỌNG"

        if has_detention_order:
            custody_res = check_custody_limit(
                crime_severity=max_severity,
                custody_start_date=arrest_date,
                current_date=current_date
            )
            warnings.append(ProceduralWarningSchema(
                severity=custody_res.status,
                message=custody_res.recommendation,
                article_reference=custody_res.article_reference or "Điều 173 BLTTHS"
            ))

        return warnings
