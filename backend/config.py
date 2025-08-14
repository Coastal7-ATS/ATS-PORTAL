import os
from typing import List
from dotenv import load_dotenv

load_dotenv()

class Settings:
    # Database Configuration
    MONGODB_URL: str = os.getenv("MONGODB_URL", "mongodb+srv://your_username:your_password@your_cluster.mongodb.net/recruitment_portal?retryWrites=true&w=majority")
    
    # JWT Configuration
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "your_super_secret_jwt_key_here_make_it_long_and_random")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    
    # Server Configuration
    BACKEND_PORT: int = int(os.getenv("BACKEND_PORT", "8000"))
    BACKEND_HOST: str = os.getenv("BACKEND_HOST", "0.0.0.0")
    
    # CORS Configuration
    CORS_ORIGINS: List[str] = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
    
    # API Configuration
    API_TIMEOUT: int = int(os.getenv("API_TIMEOUT", "15000"))
    API_RETRY_ATTEMPTS: int = int(os.getenv("API_RETRY_ATTEMPTS", "2"))
    API_RETRY_DELAY: int = int(os.getenv("API_RETRY_DELAY", "1000"))
    
    # Background Task Configuration
    JOB_STATUS_CHECK_INTERVAL: int = int(os.getenv("JOB_STATUS_CHECK_INTERVAL", "3600"))
    REAL_TIME_POLLING_INTERVAL: int = int(os.getenv("REAL_TIME_POLLING_INTERVAL", "300000"))
    
    # Database Query Limits
    MAX_QUERY_LIMIT: int = int(os.getenv("MAX_QUERY_LIMIT", "100"))
    MAX_QUERY_LIMIT_LARGE: int = int(os.getenv("MAX_QUERY_LIMIT_LARGE", "1000"))
    MAX_QUERY_LIMIT_MEDIUM: int = int(os.getenv("MAX_QUERY_LIMIT_MEDIUM", "200"))

settings = Settings() 