import logging
from sqlalchemy import text, inspect
from app.db.session import engine
from app.db.base import Base

logger = logging.getLogger("uvicorn.error")

def run_migrations():
    """
    Runs database schema migrations and creates missing tables for both MySQL and SQLite dialects.
    """
    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()

    if "case_files" in existing_tables:
        columns = [c["name"] for c in inspector.get_columns("case_files")]
        if "investigation_stage" not in columns:
            logger.info("Di cư DB: Thêm cột 'investigation_stage' vào bảng 'case_files'...")
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE case_files ADD COLUMN investigation_stage VARCHAR(50) NOT NULL DEFAULT 'XAC_MINH'"))
            logger.info("Di cư DB: Thêm cột thành công.")
        else:
            logger.info("Di cư DB: Cột 'investigation_stage' đã tồn tại trong 'case_files'.")

    # Create any missing tables defined in Base metadata
    try:
        logger.info("Di cư DB: Khởi tạo các bảng mới (nếu chưa có)...")
        Base.metadata.create_all(bind=engine)
        logger.info("Di cư DB: Kiểm tra và tạo bảng hoàn tất.")
    except Exception as e:
        logger.error(f"Di cư DB: Lỗi create_all: {str(e)}")
