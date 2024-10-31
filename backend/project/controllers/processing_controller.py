import os
from celery import shared_task
from flask import jsonify, request
from project.core.pose_estimation.PoseEstimator import PoseEstimator
from project.constants.constants import ROUND_COLLECTION, SESSION_COLLECTION, VIDEO_COLLECTION
from project.controllers.video_uploader import get_short_playback_url, get_upload_token, upload_video, delete_video
from project.core.pose_estimation.Driver import process_pose_video_data
from project.core.target_scoring.Driver import process_target_video_data
import cv2
import io
import cloudinary.uploader
from bson.objectid import ObjectId
from ..db import db

round_collection = db[ROUND_COLLECTION]
session_collection = db[SESSION_COLLECTION]
video_collection = db[VIDEO_COLLECTION]

class MissingTargetModelError(Exception):
    pass

@shared_task(bind=True)
def process_target(self, round_id, video_timestamps):
    task_id = self.request.id
    
    input_filename = f"target_video_raw_{round_id}"
    input_filepath = f"/app/project/core/res/output/{input_filename}.webm"
    trimmed_filename = f"target_video_trimmed_{round_id}"
    trimmed_filepath = f"/app/project/core/res/output/{trimmed_filename}.webm"
    output_filename = f"target_video_processed_{round_id}"
    output_filepath = f"/app/project/core/res/output/{output_filename}.mp4"
    
    round_collection.update_one(
            {"target_task_id": task_id},
            {"$set": {"target_status": "PROCESSING"}}
        )
    
    try:
        existing_round = round_collection.find_one({"_id": ObjectId(round_id)})
        existing_session = session_collection.find_one({"_id": ObjectId(existing_round['session_id'])})
        
        if 'model' not in existing_session:
            raise MissingTargetModelError('Model is required in the request body')
        
        model = existing_session['model']
        
        check_and_trim_video("target", video_timestamps, input_filepath, trimmed_filepath)
        scoring_detail = process_target_video_data(trimmed_filepath, output_filepath, model)
        
        round_collection.update_one(
            {"target_task_id": task_id},
            {"$set": {"target_status": "GETTING_TOKEN", "score": scoring_detail}}
        )
        
        # request token for uploading to ByteArk
        tokens_for_raw_video = get_upload_token(input_filename)
        tokens_for_processed_video = get_upload_token(output_filename)

        round_collection.update_one(
            {"target_task_id": task_id},
            {"$set": {
                "target_status": "UPLOADING",
                "target_video": get_short_playback_url(tokens_for_processed_video),
                "target_video_raw": get_short_playback_url(tokens_for_raw_video)
                }}
        )
        
        upload_video(trimmed_filepath, tokens_for_raw_video[0])
        upload_video(output_filepath, tokens_for_processed_video[0])
        
        
        round_collection.update_one(
            {"target_task_id": task_id},
            {"$set": {"target_status": "SUCCESS"}}
        )
        
        return scoring_detail, input_filepath, output_filepath, trimmed_filepath
        
    except Exception as e:
        round_collection.update_one(
            {"target_task_id": task_id},
            {"$set": {"target_status": "FAILURE", "target_error_message": str(e)}}
        )

@shared_task(bind=True)
def process_pose(self, round_id, video_timestamps):
    task_id = self.request.id
    
    input_filename = f"pose_video_raw_{round_id}"
    input_filepath = f"/app/project/core/res/output/{input_filename}.webm"
    trimmed_filename = f"pose_video_trimmed_{round_id}"
    trimmed_filepath = f"/app/project/core/res/output/{trimmed_filename}.webm"
    output_filename = f"pose_video_processed_{round_id}"
    output_filepath = f"/app/project/core/res/output/{output_filename}.mp4"
    
    round_collection.update_one(
            {"pose_task_id": task_id},
            {"$set": {"pose_status": "PROCESSING"}}
        )
    
    try:
        check_and_trim_video("pose", video_timestamps, input_filepath, trimmed_filepath)
        process_pose_video_data(trimmed_filepath, output_filepath)
        
        round_collection.update_one(
            {"pose_task_id": task_id},
            {"$set": {"pose_status": "GETTING_TOKEN"}}
        )
        
        # request token for uploading to ByteArk
        tokens_for_raw_video = get_upload_token(input_filename)
        tokens_for_processed_video = get_upload_token(output_filename)

        round_collection.update_one(
            {"pose_task_id": task_id},
            {"$set": {
                "pose_status": "UPLOADING",
                "pose_video": get_short_playback_url(tokens_for_processed_video),
                "pose_video_raw": get_short_playback_url(tokens_for_raw_video),
                }}
        )
        
        upload_video(trimmed_filepath, tokens_for_raw_video[0])
        upload_video(output_filepath, tokens_for_processed_video[0])
        
        round_collection.update_one(
            {"pose_task_id": task_id},
            {"$set": {"pose_status": "SUCCESS"}}
        )
        
        return input_filepath, output_filepath, trimmed_filepath
        
    except Exception as e:
        round_collection.update_one(
            {"pose_task_id": task_id},
            {"$set": {"pose_status": "FAILURE", "pose_error_message": str(e)}}
        )

@shared_task(bind=True, max_retries=3, default_retry_delay=30)
def capture_pose_on_shot_detected(self, results, round_id):
    scoring_detail = results[0][0]
    raw_target_video_path = results[0][1]
    target_video_path = results[0][2]
    trimmed_target_video_path = results[0][3]
    
    raw_pose_video_path = results[1][0]
    pose_video_path = results[1][1]
    trimmed_pose_video_path = results[1][2]
    
    try:
        # Upload hit frames
        scoring_detail_with_images = upload_frames(scoring_detail, target_video_path, pose_video_path)
        
        round_collection.update_one(
                {"_id": ObjectId(round_id)},
                {"$set": {
                    "score": scoring_detail_with_images,
                    "capture_status": "SUCCESS",
                    }}
            )
        
        delete_video(target_video_path)
        delete_video(pose_video_path)
        delete_video(raw_pose_video_path)
        delete_video(raw_target_video_path)
        delete_video(trimmed_target_video_path)
        delete_video(trimmed_pose_video_path)
        
    except Exception as e:
        round_collection.update_one(
            {"_id": ObjectId(round_id)},
            {"$set": {
                "capture_status": "FAILURE",
                "capture_error_message": str(e),
                "score": scoring_detail,
                }}
        )
        raise e

def upload_frames(scoring_detail, target_video_path, pose_video_path):
    scoring_detail_with_images = []
    target_cap = cv2.VideoCapture(target_video_path)
    pose_cap = cv2.VideoCapture(pose_video_path)
    
    for hit in scoring_detail:
        frame = hit['frame']
        target_cap.set(cv2.CAP_PROP_POS_FRAMES, frame)
        target_ret, target_frame = target_cap.read()
        
        pose_cap.set(cv2.CAP_PROP_POS_FRAMES, frame)
        pose_ret, pose_frame = pose_cap.read()
        
        # default value
        target_upload_result = {'secure_url': ""}
        pose_upload_result = {'secure_url': ""}
        skeleton_data = {}
        features = {}
        phase = "No Pose Detected"
        
        if target_ret:
            _, target_buffer = cv2.imencode('.jpg', target_frame)
            target_image_stream = io.BytesIO(target_buffer)
            target_upload_result = cloudinary.uploader.upload(target_image_stream, resource_type='image')
        
        if pose_ret:
            _, pose_buffer = cv2.imencode('.jpg', pose_frame)
            pose_image_stream = io.BytesIO(pose_buffer)
            pose_upload_result = cloudinary.uploader.upload(pose_image_stream, resource_type='image')
            pose_estimator = PoseEstimator()
            skeleton_data, features, phase = pose_estimator.process_pose_frame(pose_frame)
            skeleton_data = PoseEstimator().convert_keys_to_strings(skeleton_data)
        
        hit_with_image = {
            **hit,
            'target_image_url': target_upload_result['secure_url'],
            'pose_image_url': pose_upload_result['secure_url'],
            'skeleton_data': skeleton_data,
            'features': features,
            'phase': phase
            }
        scoring_detail_with_images.append(hit_with_image)
    return scoring_detail_with_images

def save_recording_timestamp(round_id, video_type, timestamp):
    try:
        video_data = {
            "round_id": ObjectId(round_id),
            "type": video_type,
            "recoring_timestamp": timestamp,
        }
        video_collection.insert_one(video_data)
        
    except Exception as e:
        video_collection.insert_one(
            {
                "round_id": ObjectId(round_id),
                "type": video_type,
                "recoring_timestamp": 0,
                "error": e
            }
        )
        
def get_recording_timestamp(round_id):
    try:
        video_timestamps = list(video_collection.find({"round_id": ObjectId(round_id)}))
        
        print("*************")
        print(video_timestamps)
                
        timestamps = {
            'pose': 0,
            'target': 0,
        }
        
        for video in video_timestamps:
            video_type = video['type']
            timestamp = video['recoring_timestamp']
            timestamps[video_type] = timestamp

        return timestamps
    except Exception:
        return {'pose': 0, 'target': 0}
    
def check_and_trim_video(type, video_timestamp, input_path, trimmed_path):
    pose_timestamp = int(video_timestamp['pose'])
    target_timestamp = int(video_timestamp['target'])
    
    print("&&&&&&&&&&&&&&&&&&")
    print(video_timestamp)
    print(pose_timestamp)
    print(target_timestamp)
    print("&&&&&&&&&&&&&&&&&&")
    
    video_to_trim_type = ""
    
    if pose_timestamp == 0 or target_timestamp == 0:
        os.rename(input_path, trimmed_path)
        return
    
    if type == 'pose' and pose_timestamp < target_timestamp:
        video_to_trim_type = "pose"
    
    if type == 'target' and target_timestamp < pose_timestamp:
        video_to_trim_type = "target"
        
    if not video_to_trim_type:
        os.rename(input_path, trimmed_path)
        return
    
    print("1 🤩")
        
    frame_rate = 30  # frames per second
    time_diff = abs(pose_timestamp - target_timestamp) / 1000
    frames_to_trim = int(time_diff * frame_rate)
    
    print("2 🤩")
    
    cap = cv2.VideoCapture(input_path)
    if not cap.isOpened():
        print(f"Error: Could not open video file {input_path}")
        return None
    print("3🤩")
        
    fourcc = cv2.VideoWriter_fourcc(*'VP80')  # WebM compatible codec
    frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    frame_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    out = cv2.VideoWriter(trimmed_path, fourcc, frame_rate, (frame_width, frame_height))
        
    print("4🤩")
    for _ in range(frames_to_trim):
        ret = cap.grab()  # Grab frames without decoding to skip them
        if not ret:
            print("Error: Could not skip enough frames")
            break

    print("5🤩")
    # Write the remaining frames to the output video
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        out.write(frame)

    print("6🤩")
    # Release resources
    cap.release()
    out.release()

    print("7🤩")
    
def add_manual_shot_by_id(round_id):
    try:
        data = request.json

        existing_round = round_collection.find_one({'_id': ObjectId(round_id)})
        round_score = existing_round.get('score')

        if existing_round and round_score:
            return insert_new_shot_to_existed_round(data, round_score, round_id)
        else:
            return jsonify({'error': 'Session not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def insert_new_shot_to_existed_round(data, round_score, round_id):
    new_frame = int(data['frame'])
    insert_index = next((i for i, d in enumerate(round_score) if d['frame'] > new_frame), len(round_score))

    new_score = data['score']
    new_point_x = data['pointX']
    new_point_y = data['pointY']
    round_score.insert(insert_index, {'id': insert_index + 1, 'frame': new_frame, 'point': [new_point_x, new_point_y], 'score': new_score})

    # Update the `id`s for all dictionaries after the inserted one
    for i in range(insert_index + 1, len(round_score)):
        round_score[i]['id'] = i + 1

    round_collection.update_one(
        {"_id": ObjectId(round_id)},
        {"$set": {"score": round_score}}
    )
    return jsonify(round_score)