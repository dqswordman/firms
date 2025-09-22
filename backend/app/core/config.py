from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "Wildfire Visualization API vNext"
    version: str = "0.1.0"

    class Config:
        env_file = "backend/.env"


settings = Settings()
