from bson import ObjectId
from celery import chord
from flask import Blueprint, jsonify, request
from datetime import datetime
from project.constants.constants import SESSION_COLLECTION
from project.controllers.decorators import token_required
from ..controllers.processing_controller import capture_pose_on_shot_detected, process_pose, process_target
from .. import db
import os

processing_bp = Blueprint('processing_bp', __name__)
collection = db[SESSION_COLLECTION]

@processing_bp.route('/upload-target-video/<id>', methods=['POST'])
@token_required
def upload_target_video(user_id, id):    
    if 'video' not in request.files:
        return {"error": "No video part"}, 400
    
    file = request.files['video']
    
    if file.filename == '':
        return {"error": "No selected file"}, 400
    
    # Save the video file
    file_path = os.path.join('/app/project/core/res/output', f'target_video_raw_{id}.webm')
    file.save(file_path)

    return {"message": "Target Video uploaded successfully"}, 200

@processing_bp.route('/upload-pose-video/<id>', methods=['POST'])
@token_required
def upload_pose_video(user_id, id):    
    if 'video' not in request.files:
        return {"error": "No video part"}, 400
    
    file = request.files['video']
    
    if file.filename == '':
        return {"error": "No selected file"}, 400
    
    # Save the video file
    file_path = os.path.join('/app/project/core/res/output', f'pose_video_raw_{id}.webm')
    file.save(file_path)

    return {"message": "Pose Video uploaded successfully"}, 200

@processing_bp.route('/process-target/<id>', methods=['POST'])
@token_required
def process_target_route(user_id, id):    
    
    chord_tasks = chord(
        [process_target.s(id), process_pose.s(id)]
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
