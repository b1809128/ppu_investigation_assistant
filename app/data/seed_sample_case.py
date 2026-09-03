import logging
from datetime import datetime, date
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.case import CaseFile, CaseDocument, InvestigationLog
from app.models.suspect import Suspect
from app.models.audit import AuditLog

logger = logging.getLogger("uvicorn.error")

def seed_real_investigation_case(db: Session):
    """
    Seeds a realistic, comprehensive investigation case file (HS-2026/089-HN)
    into the database with full suspects, procedural documents, and investigation timeline logs.
    """
    # 1. Ensure lead investigator user exists
    dtv = db.query(User).filter(User.badge_id == "dtv").first()
    if not dtv:
        dtv = db.query(User).first()
    if not dtv:
        logger.warning("SeedCase: Chưa có cán bộ điều tra trong hệ thống.")
        return

    # Check if case code HS-2026/089-HN already exists
    existing_case = db.query(CaseFile).filter(CaseFile.case_code == "HS-2026/089-HN").first()
    if existing_case:
        logger.info("SeedCase: Hồ sơ vụ án mẫu 'HS-2026/089-HN' đã tồn tại trong DB.")
        return existing_case

    logger.info("SeedCase: Khởi tạo hồ sơ vụ án thực tế mẫu 'HS-2026/089-HN'...")

    # 2. Create Case File
    sample_case = CaseFile(
        case_code="HS-2026/089-HN",
        case_name="Vụ án Cướp tài sản và Cố ý gây thương tích xảy ra tại tiệm vàng Kim Xuyên, số 188 Phố Huế, Hai Bà Trưng, Hà Nội",
        incident_date=datetime(2026, 8, 15, 20, 30, 0),
        location="Số 188 Phố Huế, phường Phố Huế, quận Hai Bà Trưng, TP. Hà Nội",
        damage_value=185000000.0,
        status="INVESTIGATING",
        investigation_stage="KHOI_TO_BI_CAN",
        lead_investigator_id=dtv.id,
        summary_acts=(
            "Vào khoảng 20 giờ 30 phút ngày 15/08/2026, bị can Trịnh Quốc Anh (sinh năm 2007) điều khiển xe máy không biển kiểm soát "
            "đến tiệm vàng Kim Xuyên tại số 188 Phố Huế, quận Hai Bà Trưng, Hà Nội. Tại đây, đối tượng đeo khẩu trang kín mặt, "
            "dùng 01 con dao nhọn (dài 25cm) và 01 khẩu súng ngắn giả khống chế bà Nguyễn Thị Kim (chủ tiệm vàng).\n\n"
            "Đối tượng kề dao nhọn trực tiếp vào vùng cổ bà Kim, đe dọa dùng vũ lực tước đoạt tính mạng và ép mở két sắt, chiếm đoạt "
            "01 khay vàng ta (trị giá 120.000.000 VNĐ) và 65.000.000 VNĐ tiền mặt (Tổng thiệt hại 185.000.000 VNĐ).\n\n"
            "Khi anh Trần Văn Bình (con trai bà Kim) chạy ra ngăn cản, đối tượng Trịnh Quốc Anh đã dùng dao đâm 01 nhát vào vùng ngực "
            "và 01 nhát vào tay trái anh Bình gây thương tích nặng (tỷ lệ tổn thương cơ thể 38%), sau đó nhảy lên xe máy tẩu thoát.\n\n"
            "Đến 02 giờ 15 phút ngày 16/08/2026, Cơ quan CSĐT Công an quận Hai Bà Trưng đã giữ người trong trường hợp khẩn cấp đối với Trịnh Quốc Anh "
            "tại nhà trọ ở quận Đống Đa, thu giữ toàn bộ vật chứng gồm 01 con dao nhọn, 01 súng giả, 185.000.000 VNĐ tài sản và xe máy gây án."
        )
    )
    db.add(sample_case)
    db.flush()  # Get generated sample_case.id

    # 3. Create Suspects & Victims
    suspect_1 = Suspect(
        case_id=sample_case.id,
        full_name="Trịnh Quốc Anh",
        dob="2007-04-12",
        identity_card="035107008912",
        prior_convictions="Đã có 01 tiền án về Tội trộm cắp tài sản theo Bản án số 45/2024/HS-ST ngày 10/05/2024 của TAND quận Đống Đa, chưa được xóa án tích (Dấu hiệu Tái phạm nguy hiểm).",
        role_in_case="SUSPECT"
    )
    
    victim_1 = Suspect(
        case_id=sample_case.id,
        full_name="Trần Văn Bình",
        dob="1998-09-20",
        identity_card="001098012345",
        prior_convictions="Bị thương tích 38% do dao nhọn đâm vùng ngực và tay trái.",
        role_in_case="VICTIM"
    )

    victim_2 = Suspect(
        case_id=sample_case.id,
        full_name="Nguyễn Thị Kim",
        dob="1965-03-15",
        identity_card="001065009876",
        prior_convictions="Chủ tiệm vàng Kim Xuyên, bị đe dọa kề dao vào cổ cưỡng đoạt tài sản.",
        role_in_case="VICTIM"
    )

    db.add_all([suspect_1, victim_1, victim_2])

    # 4. Create Procedural Investigation Documents
    docs = [
        CaseDocument(
            case_id=sample_case.id,
            name="Quyết định khởi tố vụ án hình sự số 45/QĐ-CSĐT",
            document_type="Quyết định Khởi tố Vụ án",
            file_path="/uploads/QD_Khoi_to_vu_an_45.pdf"
        ),
        CaseDocument(
            case_id=sample_case.id,
            name="Quyết định khởi tố bị can số 89/QĐ-CSĐT đối với Trịnh Quốc Anh",
            document_type="Quyết định Khởi tố Bị can",
            file_path="/uploads/QD_Khoi_to_bi_can_89.pdf"
        ),
        CaseDocument(
            case_id=sample_case.id,
            name="Lệnh tạm giam số 102/L-VKS (Thời hạn 03 tháng) - VKSND HBT phê chuẩn",
            document_type="Lệnh Tạm giam VKS",
            file_path="/uploads/Lenh_tam_giam_102.pdf"
        ),
        CaseDocument(
            case_id=sample_case.id,
            name="Kết luận giám định pháp y thương tích số 314/KLGĐ-PYT (Tỷ lệ 38%)",
            document_type="Kết luận Giám định Pháp y",
            file_path="/uploads/Ket_luan_giam_dinh_314.pdf"
        ),
        CaseDocument(
            case_id=sample_case.id,
            name="Kết luận định giá tài sản tố tụng số 78/KL-HĐĐG (Trị giá 185.000.000 VNĐ)",
            document_type="Kết luận Định giá Tài sản",
            file_path="/uploads/Ket_luan_dinh_gia_78.pdf"
        ),
        CaseDocument(
            case_id=sample_case.id,
            name="Biên bản thu giữ vật chứng số 12/BB-TGVC (Dao nhọn, súng giả, xe máy)",
            document_type="Biên bản Thu giữ Vật chứng",
            file_path="/uploads/Bien_ban_thu_giu_12.pdf"
        )
    ]
    db.add_all(docs)

    # 5. Create Investigation Timeline Logs
    logs = [
        InvestigationLog(
            case_id=sample_case.id,
            log_date=datetime(2026, 8, 15, 21, 0, 0),
            title="Tiếp nhận tin báo tố giác tội phạm & Khám nghiệm hiện trường",
            details="Tiếp nhận báo án từ bà Nguyễn Thị Kim. Tổ công tác thuộc Cơ quan CSĐT Công an quận Hai Bà Trưng tổ chức khám nghiệm hiện trường tại 188 Phố Huế, thu thập dấu vết vân tay và camera an ninh.",
            investigator_id=dtv.id
        ),
        InvestigationLog(
            case_id=sample_case.id,
            log_date=datetime(2026, 8, 16, 2, 15, 0),
            title="Giữ người trong trường hợp khẩn cấp đối với Trịnh Quốc Anh",
            details="Truy xét nóng bắt giữ khẩn cấp Trịnh Quốc Anh tại phòng trọ phường Ô Chợ Dừa, Đống Đa. Thu giữ 185 triệu đồng tài sản và hung khí gây án.",
            investigator_id=dtv.id
        ),
        InvestigationLog(
            case_id=sample_case.id,
            log_date=datetime(2026, 8, 16, 9, 0, 0),
            title="Ra Lệnh tạm giữ 03 ngày & Thông báo đến VKSND quận Hai Bà Trưng",
            details="Ra Lệnh tạm giữ số 56/L-CSĐT đối với Trịnh Quốc Anh để tiến hành các hoạt động điều tra ban đầu theo Điều 118 BLTTHS.",
            investigator_id=dtv.id
        ),
        InvestigationLog(
            case_id=sample_case.id,
            log_date=datetime(2026, 8, 18, 10, 0, 0),
            title="Khởi tố vụ án hình sự & Khởi tố bị can Trịnh Quốc Anh",
            details="Ban hành Quyết định khởi tố vụ án số 45 và Khởi tố bị can số 89 về Tội cướp tài sản (Điều 168) và Tội cố ý gây thương tích (Điều 134).",
            investigator_id=dtv.id
        ),
        InvestigationLog(
            case_id=sample_case.id,
            log_date=datetime(2026, 8, 19, 9, 0, 0),
            title="VKSND quận Hai Bà Trưng phê chuẩn Gia hạn tạm giữ Lần 1 (+3 ngày)",
            details="Nhận Quyết định phê chuẩn gia hạn tạm giữ số 23/QĐ-VKS gia hạn thời hạn tạm giữ đến 22/08/2026.",
            investigator_id=dtv.id
        ),
        InvestigationLog(
            case_id=sample_case.id,
            log_date=datetime(2026, 8, 20, 15, 30, 0),
            title="Trưng cầu giám định thương tích nạn nhân Trần Văn Bình",
            details="Nhận Kết luận giám định pháp y số 314/KLGĐ-PYT xác định tỷ lệ tổn thương cơ thể của nạn nhân Trần Văn Bình là 38%.",
            investigator_id=dtv.id
        ),
        InvestigationLog(
            case_id=sample_case.id,
            log_date=datetime(2026, 8, 22, 9, 0, 0),
            title="Thi hành Lệnh tạm giam 03 tháng đã được VKSND phê chuẩn",
            details="Tuyên bố Lệnh tạm giam số 102/L-VKS thời hạn 03 tháng đối với bị can Trịnh Quốc Anh. Chuyển bị can đến Trại tạm giam số 1 Công an TP. Hà Nội.",
            investigator_id=dtv.id
        )
    ]
    db.add_all(logs)

    # 6. Audit Log entry
    audit = AuditLog(
        user_id=dtv.id,
        action="SEED_REAL_CASE",
        resource_type="CASE_FILE",
        resource_id=sample_case.id,
        details="Tạo thành công hồ sơ vụ án thực tế mẫu HS-2026/089-HN phục vụ thử nghiệm nghiệm thu hệ thống.",
        ip_address="192.168.1.105"
    )
    db.add(audit)

    db.commit()
    logger.info("SeedCase: Đã nạp thành công hồ sơ vụ án mẫu 'HS-2026/089-HN' cùng đầy đủ Bị can, Nạn nhân, Chứng cứ và Nhật ký tố tụng!")
    return sample_case
