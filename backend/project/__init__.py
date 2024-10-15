from flask import Flask
from flask_cors import CORS
from .routes.websocket import init_websocket
import cloudinary

from .celery_init import make_celery
from .db import init_db  # Import the new db module

def create_app():
    app = Flask(__name__)
    CORS(app)

    app.config.from_object('config.Config')

    db_instance = init_db(app.config['MONGO_URI'])
    app.config['db'] = db_instance
    
    # Configure your Cloudinary credentials
    cloudinary.config(
        cloud_name=app.config['CLOUDINARY_CLOUD_NAME'],
        api_key=app.config['CLOUDINARY_API_KEY'],
        api_secret=app.config['CLOUDINARY_API_SECRET']
    )

    celery = make_celery(app)
    celery.set_default()

    socketio = init_websocket(app)
    
    from .routes import register_blueprints
    register_blueprints(app)

    return app, celery, socketio