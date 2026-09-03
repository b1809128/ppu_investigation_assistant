from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import logging
import os

from app.core.config import settings
from app.core.exceptions import register_exception_handlers, UTF8JSONResponse
from app.core.security import get_password_hash
from app.db.session import engine, SessionLocal, async_engine
# Import all models to ensure they are registered for create_all
from app.db.base import Base
from app.models.user import User
from app.models.case import CaseFile, CaseDocument, InvestigationLog
from app.models.suspect import Suspect
from app.models.audit import AuditLog

from app.services.legal import LegalService
from app.services.legal_data import LegalDataService
from app.data.seed_sample_case import seed_real_investigation_case

from app.api.auth import router as auth_router
from app.api.cases import router as cases_router
from app.api.legal import router as legal_router
from app.api.audit import router as audit_router
from app.api.laws import router as laws_router
from app.api.evaluation import router as evaluation_router
from app.api.analysis import router as analysis_router

logger = logging.getLogger("uvicorn.error")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Khởi động ứng dụng (Lifespan event)...")
    
    # 1. Run migrations and create tables if they do not exist
    try:
        from app.db.migrate_db import run_migrations
        logger.info("Khởi chạy tiến trình di cư và đồng bộ cơ sở dữ liệu...")
        run_migrations()
        logger.info("Cơ sở dữ liệu đã sẵn sàng.")
    except Exception as e:
        logger.critical(f"Không thể khởi tạo cơ sở dữ liệu: {str(e)}")
        raise e

    # 2. Seed initial users & realistic sample case if they do not exist
    db = SessionLocal()
    try:
        # Seed Admin
        admin_user = db.query(User).filter(User.badge_id == "admin").first()
        if not admin_user:
            logger.info("Tạo tài khoản quản trị hệ thống mặc định (admin)...")
            admin_user = User(
                badge_id="admin",
                password_hash=get_password_hash("admin"),
                full_name="Quản trị viên hệ thống",
                role="ADMIN",
                is_active=True
            )
            db.add(admin_user)
            db.commit()
            
        # Seed Investigator (dtv)
        dtv_user = db.query(User).filter(User.badge_id == "dtv").first()
        if not dtv_user:
            logger.info("Tạo tài khoản điều tra viên mặc định (dtv)...")
            dtv_user = User(
                badge_id="dtv",
                password_hash=get_password_hash("dtv"),
                full_name="Điều tra viên nghiệp vụ",
                role="INVESTIGATOR",
                is_active=True
            )
            db.add(dtv_user)
            db.commit()
            
        logger.info("Cấp tài khoản mặc định hoàn tất.")

        # Seed realistic real-world case file
        seed_real_investigation_case(db)

    except Exception as e:
        logger.error(f"Lỗi khi nạp dữ liệu ban đầu: {str(e)}")
        db.rollback()
    finally:
        db.close()

    # 3. Load Legal In-Memory Cache (both legacy LegalService and new LegalDataService)
    logger.info("Đang nạp cơ sở dữ liệu Luật hình sự vào bộ nhớ cache (LegalService & LegalDataService)...")
    LegalService.load_database(settings.LEGAL_DB_PATH)
    LegalDataService.load_database(settings.LEGAL_DB_PATH)
    LegalDataService.load_procedure_database(settings.LEGAL_PROCEDURE_DB_PATH)
    logger.info("Đã hoàn tất nạp luật.")

    yield

    # Shutdown logic
    logger.info("Đang tắt ứng dụng...")
    await async_engine.dispose()
    logger.info("Đã đóng kết nối cơ sở dữ liệu bất đồng bộ.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Hệ thống hỗ trợ Điều tra viên trong mạng LAN Offline - Nghiệp vụ và tra cứu luật hình sự",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    default_response_class=UTF8JSONResponse,
    lifespan=lifespan
)

# Register CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register global exception handlers
register_exception_handlers(app)

# Include API Routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(cases_router, prefix=settings.API_V1_STR)
app.include_router(legal_router, prefix=settings.API_V1_STR)
app.include_router(audit_router, prefix=settings.API_V1_STR)
app.include_router(laws_router)
app.include_router(evaluation_router)
app.include_router(analysis_router, prefix=settings.API_V1_STR)

# Mount uploads directory to serve scans/PDFs
from fastapi.staticfiles import StaticFiles
uploads_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
os.makedirs(uploads_path, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_path), name="uploads")

# Mount frontend build files if they exist
frontend_dist_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend", "dist")
if os.path.exists(frontend_dist_path):
    from fastapi.staticfiles import StaticFiles
    # Mount assets folder
    assets_path = os.path.join(frontend_dist_path, "assets")
    if os.path.exists(assets_path):
        app.mount("/assets", StaticFiles(directory=assets_path), name="assets")

    # Catch-all route to serve React SPA index.html for unknown frontend routes
    @app.get("/{full_path:path}")
    async def serve_spa(request: Request, full_path: str):
        # Ignore API endpoints
        if full_path.startswith("api/") or full_path.startswith("docs") or full_path.startswith("redoc"):
            return None
        file_path = os.path.join(frontend_dist_path, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist_path, "index.html"))
