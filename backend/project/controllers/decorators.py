from functools import wraps
from flask import request, jsonify
from .auth_controller import decode_token

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'message': 'Token is missing!'}), 403
        
        try:
            user_id = decode_token(token)
        except Exception as e:
            return jsonify({'message': str(e)}), 403
        
        return f(user_id, *args, **kwargs)
    
    return decorated
