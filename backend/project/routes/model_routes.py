from flask import Blueprint
from project.controllers.model_controller import create_model, get_model_by_name, get_models, update_model_by_id
from project.controllers.decorators import token_required

model_bp = Blueprint('model_bp', __name__)

@model_bp.route('/models', methods=['GET'])
@token_required
def model_list_route(user_id):
    return get_models(user_id)

@model_bp.route('/models', methods=['POST'])
@token_required
def model_create_route(user_id):
    return create_model(user_id)
  
@model_bp.route('/models/<model>', methods=['GET'])
@token_required
def model_detail_route(user_id, model):
    return get_model_by_name(user_id, model)

@model_bp.route('/models/<model_id>', methods=['PATCH'])
@token_required
def model_update_route(user_id, model_id):
    return update_model_by_id(user_id, model_id)
