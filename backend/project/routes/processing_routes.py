from bson import ObjectId
from celery import chord
from flask import Blueprint, jsonify
from datetime import datetime
from project.constants.constants import SESSION_COLLECTION
from project.controllers.decorators import token_required
from ..controllers.processing_controller import capture_pose_on_shot_detected, process_pose, process_target
from .. import db

processing_bp = Blueprint('processing_bp', __name__)
collection = db[SESSION_COLLECTION]

@processing_bp.route('/process-target/<id>', methods=['POST'])
@token_required
def process_target_route(user_id, id):    
    
    chord_tasks = chord(
        [process_target.s(), process_pose.s()]
    )(capture_pose_on_shot_detected.s(id))
    
    task_data = {
        "target_task_id": chord_tasks.parent[0].id,
        "pose_task_id": chord_tasks.parent[1].id,
        "target_status": chord_tasks.parent[0].status,  # Initial status "PENDING"
        "pose_status": chord_tasks.parent[1].status,  # Initial status "PENDING"
        "start_process_at": datetime.utcnow(),
    }
    
    existing_task = collection.find_one({"_id": ObjectId(id), "user_id": ObjectId(user_id)})

    if existing_task:
        # Update the existing task
        result = collection.update_one(
            {"_id": ObjectId(id), "user_id": ObjectId(user_id)},
            {"$set": task_data}
        )
        if result.modified_count == 0:
            return jsonify({"error": "Failed to update the task"}), 500
    else:
        return jsonify({"error": "Session not found"}), 500

    # Fetch the updated or inserted task
    updated_task = collection.find_one({"_id": ObjectId(id)})
    
    if not updated_task:
        return jsonify({"error": "Failed to retrieve the task after update"}), 500
    
    return jsonify({
        "_id": id,
        "user_id": user_id,
        "target_task_id": chord_tasks.parent[0].id,
        "pose_task_id": chord_tasks.parent[1].id,
        "target_status": chord_tasks.parent[0].status,
        "pose_status": chord_tasks.parent[1].status,
    }), 202
