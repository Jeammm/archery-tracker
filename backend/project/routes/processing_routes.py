from bson import ObjectId
from celery import chord
from datetime import timezone
from flask import Blueprint, jsonify, request
from datetime import datetime
from project.constants.constants import ROUND_COLLECTION
from project.controllers.decorators import token_required
from ..controllers.processing_controller import capture_pose_on_shot_detected, get_recording_timestamp, process_pose, process_target, save_recording_timestamp
from ..controllers.processing_controller_dev import capture_pose_on_shot_detected_test, process_pose_test, process_target_test
from ..db import db
import os

processing_bp = Blueprint('processing_bp', __name__)

round_collection = db[ROUND_COLLECTION]

@processing_bp.route('/upload-target-video/<round_id>', methods=['POST'])
def upload_target_video(round_id):    
    if 'video' not in request.files:
        return {"error": "No video part"}, 400
    
    file = request.files['video']
    
    if file.filename == '':
        return {"error": "No selected file"}, 400
    
    recording_start_timestamp = request.form.get('recording_start_timestamp', "0")
    
    # Save the video file
    file_path = os.path.join('/app/project/core/res/output', f'target_video_raw_{round_id}.webm')
    file.save(file_path)
    
    save_recording_timestamp(round_id, "target", recording_start_timestamp)

    return {"message": "Target Video uploaded successfully"}, 200

@processing_bp.route('/upload-pose-video/<round_id>', methods=['POST'])
@token_required
def upload_pose_video(_, round_id):    
    if 'video' not in request.files:
        return {"error": "No video part"}, 400
    
    file = request.files['video']
    
    if file.filename == '':
        return {"error": "No selected file"}, 400
    
    recording_start_timestamp = request.form.get('recording_start_timestamp', "0")
    
    # Save the video file
    file_path = os.path.join('/app/project/core/res/output', f'pose_video_raw_{round_id}.webm')
    file.save(file_path)
    
    save_recording_timestamp(round_id, "pose", recording_start_timestamp)

    return {"message": "Pose Video uploaded successfully"}, 200

@processing_bp.route('/process-target/<round_id>', methods=['POST'])
@token_required
def process_target_route(_, round_id):
    video_timestamps = get_recording_timestamp(round_id)
    
    chord_tasks = chord(
        [process_target.s(round_id, video_timestamps), process_pose.s(round_id, video_timestamps)]
    )(capture_pose_on_shot_detected.s(round_id))

    task_data = {
        "target_task_id": chord_tasks.parent[0].id,
        "pose_task_id": chord_tasks.parent[1].id,
        "capture_task_id": chord_tasks.id,
        "target_status": chord_tasks.parent[0].status,
        "pose_status": chord_tasks.parent[1].status,
        "capture_status": chord_tasks.status,
        "start_process_at": datetime.now(timezone.utc),
    }

    existing_task = round_collection.find_one({"_id": ObjectId(round_id)})

    if existing_task:
        # Update the existing task
        result = round_collection.update_one(
            {"_id": ObjectId(round_id)},
            {"$set": task_data}
        )
        if result.modified_count == 0:
            return jsonify({"error": "Failed to update the task"}), 500
    else:
        return jsonify({"error": "Session not found"}), 500

    # Fetch the updated or inserted task
    updated_task = round_collection.find_one({"_id": ObjectId(round_id)})

    if not updated_task:
        return jsonify({"error": "Failed to retrieve the task after update"}), 500

    return jsonify({
        "_id": round_id,
        "target_task_id": chord_tasks.parent[0].id,
        "pose_task_id": chord_tasks.parent[1].id,
        "capture_task_id": chord_tasks.id,
        "target_status": chord_tasks.parent[0].status,
        "pose_status": chord_tasks.parent[1].status,
        "capture_status": chord_tasks.status,
    }), 202
    
@processing_bp.route('/process-target-test/<round_id>', methods=['POST'])
@token_required
def process_target_route_test(_, round_id):
    chord_tasks = chord(
        [process_target_test.s(round_id), process_pose_test.s(round_id)]
    )(capture_pose_on_shot_detected_test.s(round_id))

    task_data = {
        "target_task_id": chord_tasks.parent[0].id,
        "pose_task_id": chord_tasks.parent[1].id,
        "target_status": chord_tasks.parent[0].status,
        "pose_status": chord_tasks.parent[1].status,
        "capture_task_id": chord_tasks.id,
        "capture_status": chord_tasks.status,
        "start_process_at": datetime.now(timezone.utc),
    }

    existing_task = round_collection.find_one({"_id": ObjectId(round_id)})

    if existing_task:
        # Update the existing task
        result = round_collection.update_one(
            {"_id": ObjectId(round_id)},
            {"$set": task_data}
        )
        if result.modified_count == 0:
            return jsonify({"error": "Failed to update the task"}), 500
    else:
        return jsonify({"error": "Session not found"}), 500

    # Fetch the updated or inserted task
    updated_task = round_collection.find_one({"_id": ObjectId(round_id)})

    if not updated_task:
        return jsonify({"error": "Failed to retrieve the task after update"}), 500

    return jsonify({
        "_id": round_id,
        "target_task_id": chord_tasks.parent[0].id,
        "pose_task_id": chord_tasks.parent[1].id,
        "target_status": chord_tasks.parent[0].status,
        "pose_status": chord_tasks.parent[1].status,
        "capture_task_id": chord_tasks.id,
        "capture_status": chord_tasks.status,
    }), 202
