from flask import Blueprint
from project.controllers.decorators import token_required
from ..controllers.session_controller import get_sessions, get_session_by_id, create_session

session_bp = Blueprint('session_bp', __name__)

@session_bp.route('/sessions', methods=['GET'])
@token_required
def session_list_route(user_id):
    return get_sessions(user_id)

@session_bp.route('/sessions', methods=['POST'])
@token_required
def session_create_route(user_id):
    return create_session(user_id)
  
@session_bp.route('/sessions/<id>', methods=['GET'])
@token_required
def session_detail_route(user_id, id):
    return get_session_by_id(user_id, id)
