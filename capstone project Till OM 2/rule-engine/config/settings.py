from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    MONGODB_URI: str
    DATABASE_NAME: str = "logistics_rules_db"
    PORT: int = 8000

    class Config:
        env_file = ".env"

# Create a global instance of settings to import anywhere
settings = Settings()