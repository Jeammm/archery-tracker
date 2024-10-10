import datetime
from flask import current_app
import jwt
import datetime

def generate_token(user_id):
    try:
        payload = {
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=1),
            'iat': datetime.datetime.utcnow(),
            'sub': str(user_id)
        }
        return jwt.encode(payload, current_app.config.get('SECRET_KEY'), algorithm='HS256')
    except Exception as e:
        return str(e)

def decode_token(bearer_token):
    try:
        token = bearer_token.split(" ")[1]
        payload = jwt.decode(token, current_app.config.get('SECRET_KEY'), algorithms=['HS256'])
        return payload['sub']
    except jwt.ExpiredSignatureError:
        return 'Signature expired. Please log in again.'
    except jwt.InvalidTokenError:
        return 'Invalid token. Please log in again.'