import os
# from dotenv import load_dotenv
# load_dotenv() 

class Config:
    DEBUG = True
    MONGO_URI = os.getenv("MONGODB_URI")
    SECRET_KEY = os.getenv("SECRET_KEY")
    CELERY_CONFIG = {"broker_url": "redis://redis", "result_backend": "redis://redis"}
    BYTEARK_TOKEN = os.getenv("BYTEARK_TOKEN")
    BYTEARK_PROJECT_KEY = os.getenv("BYTEARK_PROJECT_KEY")
    FRONTEND_BASE_URL = os.getenv("VITE_FRONTEND_URL")
    SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY")
    EMAIL_SENDER = os.getenv("EMAIL_SENDER")
    CLOUDINARY_CLOUD_NAME = os.getenv('CLOUDINARY_CLOUD_NAME')
    CLOUDINARY_API_KEY = os.getenv('CLOUDINARY_API_KEY')
    CLOUDINARY_API_SECRET = os.getenv('CLOUDINARY_API_SECRE')
    