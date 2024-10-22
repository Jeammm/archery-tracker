from flask import Blueprint
from project.controllers.decorators import token_required
from ..controllers.stat_controller import get_stat

stat_bp = Blueprint('stat_bp', __name__)

@stat_bp.route('/dashboard-stats', methods=['GET'])
@token_required
def stat_detail_route(user_id):
    return get_stat(user_id)
