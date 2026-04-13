from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str
    debug: bool = False
    crawler_base_url: str = "http://scatch-crawler:8000"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
