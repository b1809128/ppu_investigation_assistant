from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

class UTF8JSONResponse(JSONResponse):
    media_type = "application/json; charset=utf-8"

class AppException(Exception):
    def __init__(self, message: str, code: str = "BAD_REQUEST", status_code: int = 400, data: any = None):
        self.message = message
        self.code = code
        self.status_code = status_code
        self.data = data
        super().__init__(message)

class AuthException(AppException):
    def __init__(self, message: str = "Xác thực không thành công", code: str = "UNAUTHORIZED", status_code: int = 401, data: any = None):
        super().__init__(message, code, status_code, data)

class PermissionDeniedException(AppException):
    def __init__(self, message: str = "Không có quyền truy cập", code: str = "FORBIDDEN", status_code: int = 403, data: any = None):
        super().__init__(message, code, status_code, data)

class NotFoundException(AppException):
    def __init__(self, message: str = "Tài nguyên không tìm thấy", code: str = "NOT_FOUND", status_code: int = 404, data: any = None):
        super().__init__(message, code, status_code, data)

def register_exception_handlers(app: FastAPI) -> None:
    # Handler for custom AppExceptions
    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException):
        return UTF8JSONResponse(
            status_code=exc.status_code,
            content={
                "status": "error",
                "data": exc.data,
                "message": exc.message,
                "code": exc.code
            }
        )

    # Handler for FastAPI HTTPException
    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        # Infer standard codes based on status_code
        code = "HTTP_ERROR"
        if exc.status_code == 401:
            code = "UNAUTHORIZED"
        elif exc.status_code == 403:
            code = "FORBIDDEN"
        elif exc.status_code == 404:
            code = "NOT_FOUND"
            
        return UTF8JSONResponse(
            status_code=exc.status_code,
            content={
                "status": "error",
                "data": None,
                "message": exc.detail,
                "code": code
            }
        )

    # Handler for Validation Errors
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        return UTF8JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "status": "error",
                "data": exc.errors(),
                "message": "Dữ liệu yêu cầu không hợp lệ",
                "code": "VALIDATION_ERROR"
            }
        )

    # Global handler for unexpected errors
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        import logging
        logger = logging.getLogger("uvicorn.error")
        logger.error(f"Unhandled Exception: {str(exc)}", exc_info=True)
        
        return UTF8JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "status": "error",
                "data": None,
                "message": "Hệ thống gặp sự cố nội bộ. Vui lòng liên hệ quản trị viên.",
                "code": "INTERNAL_SERVER_ERROR"
            }
        )
