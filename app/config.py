import os
from dotenv import load_dotenv
from pydantic_settings import BaseSettings

load_dotenv()

class Settings(BaseSettings):
    """Application settings loaded from environment variables and .env file."""

    openai_api_key: str
    openai_base_url: str = "https://integrate.api.nvidia.com/v1"
    redis_url: str = "redis://localhost:6379"
    model_name: str = "meta/llama-3.3-70b-instruct"
    max_tokens: int = 1000
    temperature: float = 0.1

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
