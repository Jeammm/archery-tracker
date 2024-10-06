from flask import Blueprint, jsonify

from project.controllers.decorators import token_required
from ..controllers.auth_controller import register, login, edit_profile, request_password_reset, reset_password, reset_password_with_old_password

auth_bp = Blueprint('auth_bp', __name__)

@auth_bp.route('/register', methods=['POST'])
def register_route():
    return register()
  
@auth_bp.route('/login', methods=['POST'])
def login_route():
    return login()

@auth_bp.route('/profile/<id>', methods=['PATCH'])
@token_required
def edit_profile_route(user_id, id):
    if user_id != id:
        return jsonify({'error': "User ID does not match!"}), 403
    return edit_profile(id)

@auth_bp.route('/request-reset-password', methods=['POST'])
def request_reset_password():
    return request_password_reset()

@auth_bp.route('/setup-new-password', methods=['POST'])
def password_reset():
    return reset_password()

@auth_bp.route('/change-password', methods=['POST'])
@token_required
def password_change(user_id):
    return reset_password_with_old_password(user_id)