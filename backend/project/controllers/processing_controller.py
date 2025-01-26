from datetime import timedelta
import os
from celery import shared_task
from flask import jsonify, request
from project.core.pose_estimation.PoseEstimator import PoseEstimator
from project.constants.constants import ROUND_COLLECTION, SESSION_COLLECTION, VIDEO_COLLECTION, MODEL_COLLECTION
from project.controllers.video_uploader import check_and_trim_video, format_video_before_upload, get_short_playback_url, get_upload_token, upload_video, delete_video
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
model_collection = db[MODEL_COLLECTION]

class MissingTargetModelError(Exception):
    pass

class ModelNotExistError(Exception):
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
    compressed_trimmed_filepath = f"/app/project/core/res/output/compressed_{trimmed_filename}.mp4"
    compressed_output_filepath = f"/app/project/core/res/output/compressed_{output_filename}.mp4"
    
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
        existing_model = model_collection.find_one({"model": model})
        
        if not existing_model:
            raise ModelNotExistError('This model is not exist in the data base')
        
        # Trim the video based on the timestamps
        check_and_trim_video("target", video_timestamps, input_filepath, trimmed_filepath)
        
        # Process the trimmed video data
        scoring_detail = process_target_video_data(trimmed_filepath, output_filepath, existing_model)
        
        # Update the round status before token request
        round_collection.update_one(
            {"target_task_id": task_id},
            {"$set": {"target_status": "GETTING_TOKEN", "score": scoring_detail}}
        )
        
        # Compress the videos
        format_video_before_upload(trimmed_filepath, compressed_trimmed_filepath)
        format_video_before_upload(output_filepath, compressed_output_filepath)
        
        # Request tokens for uploading
        tokens_for_raw_video = get_upload_token(input_filename)
        tokens_for_processed_video = get_upload_token(output_filename)

        # Update the round with video URLs and status before uploading
        round_collection.update_one(
            {"target_task_id": task_id},
            {"$set": {
                "target_status": "UPLOADING",
                "target_video": get_short_playback_url(tokens_for_processed_video),
                "target_video_raw": get_short_playback_url(tokens_for_raw_video)
            }}
        )
        
        # Upload the compressed videos
        upload_video(compressed_trimmed_filepath, tokens_for_raw_video[0])
        upload_video(compressed_output_filepath, tokens_for_processed_video[0])
        
        # Final status update
        round_collection.update_one(
            {"target_task_id": task_id},
            {"$set": {"target_status": "SUCCESS"}}
        )
        
        return scoring_detail, input_filepath, output_filepath, trimmed_filepath, compressed_trimmed_filepath, compressed_output_filepath
        
    except Exception as e:
        # If there is an error, update the status to failure
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
    compressed_trimmed_filepath = f"/app/project/core/res/output/compressed_{trimmed_filename}.mp4"
    compressed_output_filepath = f"/app/project/core/res/output/compressed_{output_filename}.mp4"
    
    round_collection.update_one(
        {"pose_task_id": task_id},
        {"$set": {"pose_status": "PROCESSING"}}
    )
    
    try:
        # Trim the video based on the timestamps
        check_and_trim_video("pose", video_timestamps, input_filepath, trimmed_filepath)
        
        # Process the pose video data
        aiming_frames = process_pose_video_data(trimmed_filepath, output_filepath)
        
        # Update the round status before token request
        round_collection.update_one(
            {"pose_task_id": task_id},
            {"$set": {"pose_status": "GETTING_TOKEN"}}
        )
                
        # Compress the videos
        format_video_before_upload(trimmed_filepath, compressed_trimmed_filepath)
        format_video_before_upload(output_filepath, compressed_output_filepath)
        
        # Request tokens for uploading
        tokens_for_raw_video = get_upload_token(input_filename)
        tokens_for_processed_video = get_upload_token(output_filename)

        # Update the round with video URLs and status before uploading
        round_collection.update_one(
            {"pose_task_id": task_id},
            {"$set": {
                "pose_status": "UPLOADING",
                "pose_video": get_short_playback_url(tokens_for_processed_video),
                "pose_video_raw": get_short_playback_url(tokens_for_raw_video)
            }}
        )
        
        # Upload the compressed videos
        upload_video(compressed_trimmed_filepath, tokens_for_raw_video[0])
        upload_video(compressed_output_filepath, tokens_for_processed_video[0])
        
        # Final status update
        round_collection.update_one(
            {"pose_task_id": task_id},
            {"$set": {"pose_status": "SUCCESS"}}
        )
        
        return input_filepath, output_filepath, trimmed_filepath, aiming_frames, compressed_trimmed_filepath, compressed_output_filepath
        
    except Exception as e:
        # If there is an error, update the status to failure
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
    compressed_trimmed_target_video_path = results[0][4]
    compressed_output_target_video_path = results[0][5]
    
    raw_pose_video_path = results[1][0]
    pose_video_path = results[1][1]
    trimmed_pose_video_path = results[1][2]
    aiming_frames = results[1][3]
    compressed_trimmed_pose_video_path = results[1][4]
    compressed_output_pose_video_path = results[1][5]
    
    try:
        # Upload hit frames
        scoring_detail_with_images = upload_frames(scoring_detail, target_video_path, pose_video_path)
        
        for shot in scoring_detail_with_images:
            start_aiming_frame = find_aiming_frame_from_shot(aiming_frames, shot['frame'])
            fts = shot['frame'] - start_aiming_frame
            if fts > 0:
                shot['tts'] = fts * 0.033
            else:
                shot['tts'] = 0
        
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
        delete_video(compressed_trimmed_target_video_path)
        delete_video(compressed_output_target_video_path)
        delete_video(compressed_trimmed_pose_video_path)
        delete_video(compressed_output_pose_video_path)
        
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
    
    for hit in scoring_detail:
        frame = hit['frame']
        frame_pair_result = capture_frame_pair(frame, target_video_path, pose_video_path)
        
        hit_with_image = {
            **hit,
            **frame_pair_result,
            }
        scoring_detail_with_images.append(hit_with_image)
    return scoring_detail_with_images


@shared_task()
def capture_frame_task(round_id, shot_id, frame, target_video_path, pose_video_path):
    frame_data = capture_frame_pair(frame, target_video_path, pose_video_path)
    # Update the database with the processed frame data
    round_collection.update_one(
        {"_id": ObjectId(round_id), "score.id": shot_id},
        {"$set": {
            "score.$.target_image_url": frame_data['target_image_url'],
            "score.$.pose_image_url": frame_data['pose_image_url'],
            "score.$.skeleton_data": frame_data['skeleton_data'],
            "score.$.features": frame_data['features'],
            "score.$.phase": frame_data['phase']
        }}
    )

def capture_frame_pair(frame, target_video_path, pose_video_path):
    # Pick the highest quality streams
    target_video_url = target_video_path
    pose_video_url = pose_video_path
    # target_video_url = get_highest_quality_stream(target_video_path)
    # pose_video_url = get_highest_quality_stream(pose_video_path)
    
    target_cap = cv2.VideoCapture(target_video_url)
    pose_cap = cv2.VideoCapture(pose_video_url)

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
        target_upload_result = read_frame_buffer_and_upload(target_frame)
    if pose_ret:
        pose_upload_result = read_frame_buffer_and_upload(pose_frame)
        pose_estimator = PoseEstimator()
        skeleton_data, features, phase = pose_estimator.process_pose_frame(pose_frame)
        skeleton_data = PoseEstimator().convert_keys_to_strings(skeleton_data)

    return {
        'target_image_url': target_upload_result['secure_url'],
        'pose_image_url': pose_upload_result['secure_url'],
        'skeleton_data': skeleton_data,
        'features': features,
        'phase': phase
    }

def read_frame_buffer_and_upload(frame):
    _, target_buffer = cv2.imencode('.jpg', frame)
    target_image_stream = io.BytesIO(target_buffer)
    return cloudinary.uploader.upload(target_image_stream, resource_type='image')

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
    
def add_manual_shot_by_id(round_id):
    try:
        data = request.json

        existing_round = round_collection.find_one({'_id': ObjectId(round_id)})
        round_score = existing_round.get('score')
        target_video_path = existing_round['target_video'][0]['playbackUrls'][0]['hls'][0]['url']
        pose_video_path = existing_round['pose_video'][0]['playbackUrls'][0]['hls'][0]['url']
        round_start_time = existing_round['created_at']

        if existing_round and round_score:
            return insert_new_shot_to_existed_round(data, round_score, round_id, target_video_path, pose_video_path, round_start_time)
        elif existing_round:
            return insert_new_shot_to_existed_round(data, [], round_id, target_video_path, pose_video_path, round_start_time)
        else:
            return jsonify({'error': 'Round not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def insert_new_shot_to_existed_round(data, round_score, round_id, target_video_path, pose_video_path, round_start_time):
    new_frame = int(data['frame'])
    insert_index = next((i for i, d in enumerate(round_score) if d['frame'] > new_frame), len(round_score))

    new_score = data['score']
    new_point_x = data['pointX']
    new_point_y = data['pointY']
    new_hit_time = round_start_time + timedelta(seconds=new_frame * (1/30))
    
    # Insert the new frame into the round score
    new_shot = {
        'id': insert_index + 1,
        'frame': new_frame,
        'point': [new_point_x, new_point_y],
        'score': new_score,
        'hit_time': new_hit_time,
        # Placeholder values for async processing
        'target_image_url': None,
        'pose_image_url': None,
        'skeleton_data': {},
        'features': {},
        'phase': "Processing"
    }
    round_score.insert(insert_index, new_shot)

    # Update the `id`s for all dictionaries after the inserted one
    for i in range(insert_index + 1, len(round_score)):
        round_score[i]['id'] = i + 1

    # Update the database immediately with the placeholder
    round_collection.update_one(
        {"_id": ObjectId(round_id)},
        {"$set": {"score": round_score}}
    )

    # Offload the frame capture to a background task
    capture_frame_task.delay(round_id, insert_index + 1, new_frame, target_video_path, pose_video_path)

    return jsonify(round_score)

def edit_manual_shot_by_id(round_id, hit_id):
    try:
        data = request.json

        existing_round = round_collection.find_one({'_id': ObjectId(round_id)})
        target_video_path = existing_round['target_video'][0]['playbackUrls'][0]['hls'][0]['url']
        pose_video_path = existing_round['pose_video'][0]['playbackUrls'][0]['hls'][0]['url']
        round_score = existing_round.get('score')

        if existing_round and round_score and int(hit_id) in [hit['id'] for hit in round_score]:  
            round_start_time = existing_round['created_at']
            return edit_shot_to_existed_round(data, round_score, round_id, hit_id, round_start_time, target_video_path, pose_video_path)
        else:
            return jsonify({'error': 'Hit not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def remove_manual_shot_by_id(round_id, hit_id):
    try:
        # Validate the input data
        if not round_id or not hit_id:
            return jsonify({'error': 'Missing round_id or hit_id'}), 400

        # Find the round document by round_id
        round_doc = round_collection.find_one({'_id': ObjectId(round_id)})
        if not round_doc:
            return jsonify({'error': 'Round not found'}), 404

        # Ensure the round has a 'scores' array
        scores = round_doc.get('score', [])
        if not scores:
            return jsonify({'error': 'No scores found in the round'}), 404

        # Find and remove the shot with the specified hit_id
        updated_scores = [hit for hit in scores if hit.get('id') != int(hit_id)]
        if len(updated_scores) == len(scores):
            return jsonify({'error': 'Shot not found in the scores'}), 404

        # Reindex the scores to maintain sequential order
        for shot in updated_scores:
            if shot['id'] > int(hit_id):
                shot['id'] = shot['id'] - 1  # Update the position for each shot

        # Update the round document with the modified scores array
        result = round_collection.update_one(
            {'_id': ObjectId(round_id)},
            {'$set': {'score': updated_scores}}
        )

        if result.modified_count == 0:
            return jsonify({'error': 'Failed to update the round'}), 500

        return jsonify({'message': 'Shot successfully removed and reindexed'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
def edit_shot_to_existed_round(new_shot_data, round_score, round_id, hit_id, round_start_time, target_video_path, pose_video_path):
    new_frame = int(new_shot_data['frame'])
    new_score = new_shot_data['score']
    new_point_x = new_shot_data['pointX']
    new_point_y = new_shot_data['pointY']
    new_hit_time = round_start_time + timedelta(seconds=new_frame * (1 / 30))
    
    for shot in round_score:
        if shot['id'] == int(hit_id):
            if new_frame == shot['frame']:
                shot['point'] = [new_point_x, new_point_y]
                shot['score'] = new_score
            else:
                # Update the shot information immediately
                shot['frame'] = new_frame
                shot['point'] = [new_point_x, new_point_y]
                shot['score'] = new_score
                shot['hit_time'] = new_hit_time
                
                # Placeholder values for asynchronous processing
                shot['target_image_url'] = None
                shot['pose_image_url'] = None
                shot['skeleton_data'] = {}
                shot['features'] = {}
                shot['phase'] = "Processing"

                # Offload frame capture to a background task
                capture_frame_task.delay(round_id, hit_id, new_frame, target_video_path, pose_video_path)
                break

    # Update the database immediately with the modified data
    round_collection.update_one(
        {"_id": ObjectId(round_id)},
        {"$set": {"score": round_score}}
    )

    return jsonify(round_score)

def find_aiming_frame_from_shot(aiming_frames, shot_frame):
    closest = [frame for frame in aiming_frames if frame < shot_frame]
    return max(closest) if closest else shot_frame
