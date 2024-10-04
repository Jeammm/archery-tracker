import datetime
from flask import jsonify, request, current_app
from project.constants.constants import ACCOUNT_COLLECTION
from .. import db
from flask_bcrypt import Bcrypt
import jwt

bcrypt = Bcrypt()

def register():
    try:
        data = request.json
        collection = db[ACCOUNT_COLLECTION]

        # Check if the user already exists
        if collection.find_one({'email': data['email']}):
            return jsonify({'error': 'User already exists'}), 400

        # Hash the password
        hashed_password = bcrypt.generate_password_hash(data['password']).decode('utf-8')
        data['password'] = hashed_password

        result = collection.insert_one(data)
        token = generate_token(result.inserted_id)
        return jsonify({'id': str(result.inserted_id), 'name': data['name'], 'email': data['email'], 'token': token}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def login():
    try:
        data = request.json
        collection = db[ACCOUNT_COLLECTION]

        user = collection.find_one({'email': data['email']})
        if user and bcrypt.check_password_hash(user['password'], data['password']):
            token = generate_token(user['_id'])
            return jsonify({'id': str(user['_id']), 'name': user['name'], 'email': user['email'], 'token': token}), 200
        else:
            return jsonify({'error': 'Invalid email or password'}), 401
    except Exception as e:
        return jsonify({'error': str(e)}), 500

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
