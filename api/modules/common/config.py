from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

API_DIR = Path(__file__).resolve().parent.parent.parent
ENV_PATH = API_DIR / ".env"


class Settings(BaseSettings):
    supabase_url: str = ""
    supabase_key: str = ""
    api_jwt_key: str = ""
    api_jwt_algorithm: str = "HS256"
    api_jwt_key_lifetime: str = "900"
    gemini_key: str = ""

    model_config = SettingsConfigDict(
        env_file=str(ENV_PATH), env_file_encoding="utf-8", extra="ignore"
    )


settings: Settings = Settings()

# Alias tiện lợi cho các module khác import trực tiếp
SUPABASE_URL = settings.supabase_url
SUPABASE_KEY = settings.supabase_key
JWT_SECRET_KEY = settings.api_jwt_key
JWT_ALGORITHM = settings.api_jwt_algorithm or "HS256"
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

