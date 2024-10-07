import datetime
from flask import jsonify, request, current_app
from project.utils.mailer import sendEmail
from project.constants.constants import ACCOUNT_COLLECTION
from .. import db
from flask_bcrypt import Bcrypt
from bson.objectid import ObjectId
import jwt
import datetime

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
        data['is_verified'] = False  # User needs to verify their email
        del data['confirmPassword']

        # Insert the user into the database
        result = collection.insert_one(data)

        # Generate a verification token
        verification_token = generate_token(result.inserted_id)

        # Send the verification email
        send_verification_email(data['email'], verification_token)

        return jsonify({
            'message': 'User registered successfully. Please check your email to verify your account.'
        }), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500

def send_verification_email(email, token):
    try:
        subject = 'Verify Your Email Address'
        verify_url = f"{current_app.config.get('FRONTEND_BASE_URL')}/verify-email?token={token}"
        body = f"<strong>Please verify your email by clicking the following link: {verify_url}</strong>"
        sendEmail(email, subject, body)
    except Exception as e:
        return jsonify({'error': f'Failed to send email: {str(e)}'}), 500
    
def verify_email():
    try:
        token = request.args.get('token')
        
        if not token:
            return jsonify({'error': 'Verification token is required.'}), 400

        # Decode the token to get the user_id
        user_id = decode_token(f"Bearer {token}")

        if isinstance(user_id, str) and 'Invalid' in user_id:
            return jsonify({'error': 'Invalid or expired token.'}), 400

        collection = db[ACCOUNT_COLLECTION]
        user = collection.find_one({'_id': ObjectId(user_id)})

        if not user:
            return jsonify({'error': 'User not found.'}), 404

        # Update the user's verification status
        collection.update_one({'_id': ObjectId(user_id)}, {'$set': {'is_verified': True}})

        return jsonify({'message': 'Email verified successfully. You can now log in.'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

def login():
    try:
        data = request.json
        collection = db[ACCOUNT_COLLECTION]

        user = collection.find_one({'email': data['email']})

        if user and not user['is_verified']:
            return jsonify({'error': 'Account not verified, Please check your email'}), 401
        
        if user and bcrypt.check_password_hash(user['password'], data['password']):
            token = generate_token(user['_id'])
            return jsonify({'id': str(user['_id']), 'name': user['name'], 'email': user['email'], 'token': token}), 200
        else:
            return jsonify({'error': 'Invalid email or password'}), 401
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def edit_profile(user_id):
    try:
        # Get the name and email from the request data
        data = request.json
        name = data.get('name')
        email = data.get('email')

        if not name or not email:
            return jsonify({'error': 'Name and email are required.'}), 400

        collection = db[ACCOUNT_COLLECTION]

        # Find the user by user_id
        user = collection.find_one({'_id': ObjectId(user_id)})

        if not user:
            return jsonify({'error': 'User not found.'}), 404

        # Update the user profile with new data
        update_data = {
            'name': name,
            'email': email
        }
        collection.update_one({'_id': ObjectId(user_id)}, {'$set': update_data})

        return jsonify({'message': 'Profile updated successfully.'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
def request_password_reset():
    try:
        data = request.json
        email = data.get('email')
        
        if not email:
            return jsonify({'error': 'Email is required.'}), 400

        collection = db[ACCOUNT_COLLECTION]
        user = collection.find_one({'email': email})
        
        if not user:
            return jsonify({'error': 'User with this email does not exist.'}), 404

        # Generate password reset token
        reset_token = generate_token(user['_id'])
        
        # Send email with reset token (You'll need to configure mail server)
        send_reset_email(email, reset_token)
        
        return jsonify({'message': 'Password reset email sent.'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

def send_reset_email(email, token):
    try:
        subject = 'Password Reset Request'
        reset_url = f"{current_app.config.get('FRONTEND_BASE_URL')}/reset-forgot-password?token={token}"  # Adjust URL as needed
        body = f"<strong>To reset your password, click the following link: {reset_url}</strong>"
        sendEmail(email, subject, body)
    except Exception as e:
        return jsonify({'error': f'Failed to send email: {str(e)}'}), 500

def reset_password():
    try:
        data = request.json
        reset_token = data.get('token')
        new_password = data.get('new_password')

        if not reset_token or not new_password:
            return jsonify({'error': 'Token and new password are required.'}), 400

        # Decode the token to get the user_id
        user_id = decode_token(f"Bearer {reset_token}")

        if isinstance(user_id, str) and 'Invalid' in user_id:
            return jsonify({'error': 'Invalid or expired token.'}), 400

        collection = db[ACCOUNT_COLLECTION]
        user = collection.find_one({'_id': ObjectId(user_id)})

        if not user:
            return jsonify({'error': 'User not found.'}), 404

        # Hash the new password
        hashed_password = bcrypt.generate_password_hash(new_password).decode('utf-8')

        # Update the user's password
        collection.update_one({'_id': ObjectId(user_id)}, {'$set': {'password': hashed_password}})

        return jsonify({'message': 'Password has been reset successfully.'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
def reset_password_with_old_password(user_id):
    try:
        data = request.json
        old_password = data.get('old_password')
        new_password = data.get('new_password')

        if not old_password or not new_password:
            return jsonify({'error': 'Old password and new password are required.'}), 400

        collection = db[ACCOUNT_COLLECTION]
        
        # Find the user by user_id
        user = collection.find_one({'_id': ObjectId(user_id)})

        if not user:
            return jsonify({'error': 'User not found.'}), 404

        # Check if the old password matches the stored hashed password
        if not bcrypt.check_password_hash(user['password'], old_password):
            return jsonify({'error': 'Old password is incorrect.'}), 401

        # Hash the new password
        hashed_new_password = bcrypt.generate_password_hash(new_password).decode('utf-8')

        # Update the user's password
        collection.update_one({'_id': ObjectId(user_id)}, {'$set': {'password': hashed_new_password}})

        return jsonify({'message': 'Password has been reset successfully.'}), 200

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
