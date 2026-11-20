from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    supabase_url: str = ""
    supabase_key: str = ""
    api_jwt_key: str = ""
    api_jwt_algorithm: str = ""
    api_jwt_key_lifetime: str = ""
    gemini_key: str = ""

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )


settings: Settings = Settings()
