from celery import shared_task
from project.core.pose_estimation.PoseEstimator import PoseEstimator
from project.constants.constants import ROUND_COLLECTION, SESSION_COLLECTION
from project.controllers.video_uploader import get_upload_token, upload_video, delete_video
from project.core.pose_estimation.Driver import process_pose_video_data
from project.core.target_scoring.Driver import process_target_video_data
import cv2
import io
import cloudinary.uploader
from bson.objectid import ObjectId
from ..db import db

round_collection = db[ROUND_COLLECTION]
session_collection = db[SESSION_COLLECTION]

class MissingTargetModelError(Exception):
    pass

@shared_task(bind=True)
def process_target(self, round_id):
    task_id = self.request.id
    
    input_filename = f"target_video_raw_{round_id}"
    input_filepath = f"/app/project/core/res/output/{input_filename}.webm"
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
        
        scoring_detail = process_target_video_data(input_filepath, output_filepath, model)
        
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
                "target_video": tokens_for_processed_video,
                "target_video_raw": tokens_for_raw_video
                }}
        )
        
        upload_video(input_filepath, tokens_for_raw_video[0])
        upload_video(output_filepath, tokens_for_processed_video[0])
        
        
        round_collection.update_one(
            {"target_task_id": task_id},
            {"$set": {"target_status": "SUCCESS"}}
        )
        
        return scoring_detail, input_filepath, output_filepath
        
    except Exception as e:
        round_collection.update_one(
            {"target_task_id": task_id},
            {"$set": {"target_status": "FAILURE", "target_error_message": str(e)}}
        )

@shared_task(bind=True)
def process_pose(self, round_id):
    task_id = self.request.id
    
    input_filename = f"pose_video_raw_{round_id}"
    input_filepath = f"/app/project/core/res/output/{input_filename}.webm"
    output_filename = f"pose_video_processed_{round_id}"
    output_filepath = f"/app/project/core/res/output/{output_filename}.mp4"
    
    round_collection.update_one(
            {"pose_task_id": task_id},
            {"$set": {"pose_status": "PROCESSING"}}
        )
    
    try:
        process_pose_video_data(input_filepath, output_filepath)
        
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
                "pose_video": tokens_for_processed_video,
                "pose_video_raw": tokens_for_raw_video,
                }}
        )
        
        upload_video(input_filepath, tokens_for_raw_video[0])
        upload_video(output_filepath, tokens_for_processed_video[0])
        
        round_collection.update_one(
            {"pose_task_id": task_id},
            {"$set": {"pose_status": "SUCCESS"}}
        )
        
        return input_filepath, output_filepath
        
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
    
    raw_pose_video_path = results[1][0]
    pose_video_path = results[1][1]
    
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