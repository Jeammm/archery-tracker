from flask import Flask
from flask_cors import CORS

from .extensions import db
from pymongo import MongoClient
import certifi

from .utils import make_celery

mongo_client = None
db = None


def create_app():
    global mongo_client, db
    app = Flask(__name__)
    CORS(app)

    app.config.from_object('config.Config')

    mongo_client = MongoClient(app.config['MONGO_URI'], tlsCAFile=certifi.where())
    db = mongo_client.flask_database

    celery = make_celery(app)
    celery.set_default()
    
    from .views import views
    app.register_blueprint(views)
    
    from .routes import register_blueprints
    register_blueprints(app)

    return app, celery