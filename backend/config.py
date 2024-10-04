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
    # Add more configurations as needed
    