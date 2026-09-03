import os
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    PROJECT_NAME: str = "Investigation & Criminal Law Assistant"
    API_V1_STR: str = "/api"
    
    # Database Configuration (MySQL or SQLite)
    DB_TYPE: str = Field(default="sqlite", validation_alias="DB_TYPE")  # "sqlite" or "mysql"
    DB_USER: str = Field(default="root", validation_alias="DB_USER")
    DB_PASSWORD: str = Field(default="", validation_alias="DB_PASSWORD")
    DB_HOST: str = Field(default="127.0.0.1", validation_alias="DB_HOST")
    DB_PORT: str = Field(default="3306", validation_alias="DB_PORT")
    DB_NAME: str = Field(default="investigation_assistant", validation_alias="DB_NAME")
    
    @property
    def DATABASE_URL(self) -> str:
        if self.DB_TYPE.lower() == "mysql":
            return f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}?charset=utf8mb4"
        return f"sqlite:///./ppu_assistant.db"

    @property
    def ASYNC_DATABASE_URL(self) -> str:
        if self.DB_TYPE.lower() == "mysql":
            return f"mysql+aiomysql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}?charset=utf8mb4"
        return f"sqlite+aiosqlite:///./ppu_assistant.db"

    # JWT Authentication Configuration
    JWT_SECRET_KEY: str = Field(
        default="9a7f34c2b901da3d548e6ef829a28c0b58e72efcb2c7104b2bcf2e89d18f8e12", 
        validation_alias="JWT_SECRET_KEY"
    )
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Legal Penal Code Database Config
    LEGAL_DB_PATH: str = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 
        "data", 
        "bo_luat_hinh_su_2015.json"
    )
    LEGAL_PROCEDURE_DB_PATH: str = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 
        "data", 
        "bo_luat_to_tung_hinh_su_2015.json"
    )

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
