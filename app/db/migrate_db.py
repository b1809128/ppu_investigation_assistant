import logging
from sqlalchemy import text
from app.db.session import engine
from app.db.base import Base

logger = logging.getLogger("uvicorn.error")

def run_migrations():
    """
    Runs custom database schema migrations to update case_files and create new tables.
    """
    with engine.begin() as conn:
        # Check if 'investigation_stage' column exists in 'case_files' table
        try:
            # Query column names for case_files
            result = conn.execute(text("SHOW COLUMNS FROM case_files LIKE 'investigation_stage'"))
            column_exists = result.fetchone() is not None
            
            if not column_exists:
                logger.info("Di cư DB: Thêm cột 'investigation_stage' vào bảng 'case_files'...")
                conn.execute(text("ALTER TABLE case_files ADD COLUMN investigation_stage VARCHAR(50) NOT NULL DEFAULT 'XAC_MINH'"))
                logger.info("Di cư DB: Thêm cột thành công.")
            else:
                logger.info("Di cư DB: Cột 'investigation_stage' đã tồn tại trong 'case_files'.")
        except Exception as e:
            logger.error(f"Di cư DB: Lỗi kiểm tra / alter table case_files: {str(e)}")

        # Create any tables that don't exist (e.g., investigation_logs)
        try:
            logger.info("Di cư DB: Khởi tạo các bảng mới (nếu chưa có)...")
            Base.metadata.create_all(bind=engine)
            logger.info("Di cư DB: Kiểm tra và tạo bảng hoàn tất.")
        except Exception as e:
            logger.error(f"Di cư DB: Lỗi create_all: {str(e)}")
