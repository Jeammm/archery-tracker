from pymongo import MongoClient
import certifi

mongo_client = None
db = None

def init_db(uri):
    global mongo_client, db
    mongo_client = MongoClient(uri, tlsCAFile=certifi.where())
    db = mongo_client.flask_database
    return db