import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    MONGODB_URL: str = os.getenv("MONGODB_URI", os.getenv("MONGODB_URL", "mongodb+srv://Bharathi123:Bharathi123@cluster0.q0k9nft.mongodb.net/ats_recruitment?retryWrites=true&w=majority&appName=Cluster0"))
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "your_super_secret_jwt_key_here_make_it_long_and_random")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

settings = Settings() 