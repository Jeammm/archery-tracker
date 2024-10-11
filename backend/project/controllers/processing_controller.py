from celery import shared_task
from project.constants.constants import SESSION_COLLECTION
from project.controllers.video_uploader import get_upload_token, upload_video, delete_video
from project.core.pose_estimation.Driver import process_pose_video_data
from project.core.target_scoring.Driver import process_target_video_data
import time
import cv2
import io
import cloudinary.uploader
from bson.objectid import ObjectId
from .. import db

collection = db[SESSION_COLLECTION]

class MissingTargetModelError(Exception):
    pass

@shared_task(bind=True)
def process_target(self, sessionId):
    task_id = self.request.id
    timestamp = int(time.time())
    
    input_filename = f"target_video_raw_{sessionId}"
    input_filepath = f"/app/project/core/res/output/{input_filename}.webm"
    output_filename = f"target_video_processed_{timestamp}"
    output_filepath = f"/app/project/core/res/output/{output_filename}.mp4"
    
    collection.update_one(
            {"target_task_id": task_id},
            {"$set": {"target_status": "PROCESSING"}}
        )
    
    try:
        existing_session = collection.find_one({"_id": ObjectId(sessionId)})
        
        if 'model' not in existing_session:
            raise MissingTargetModelError('Model is required in the request body')
        
        model = existing_session['model']
        
        scoring_detail = process_target_video_data(input_filepath, output_filepath, model)
        
        collection.update_one(
            {"target_task_id": task_id},
            {"$set": {"target_status": "GETTING_TOKEN", "score": scoring_detail}}
        )
        
        # request token for uploading to ByteArk
        tokens_for_raw_video = get_upload_token(input_filename)
        tokens_for_processed_video = get_upload_token(output_filename)

        collection.update_one(
            {"target_task_id": task_id},
            {"$set": {
                "target_status": "UPLOADING",
                "target_video": tokens_for_processed_video,
                "target_video_raw": tokens_for_raw_video
                }}
        )
        
        upload_video(input_filepath, tokens_for_raw_video[0])
        upload_video(output_filepath, tokens_for_processed_video[0])
        
        
        collection.update_one(
            {"target_task_id": task_id},
            {"$set": {"target_status": "UPLOADED"}}
        )
        
        return scoring_detail, input_filepath, output_filepath
        
    except Exception as e:
        collection.update_one(
            {"target_task_id": task_id},
            {"$set": {"target_status": "FAILURE", "target_error_message": str(e)}}
        )

@shared_task(bind=True)
def process_pose(self, sessionId):
    task_id = self.request.id
    timestamp = int(time.time())
    
    input_filename = f"pose_video_raw_{sessionId}"
    input_filepath = f"/app/project/core/res/output/{input_filename}.webm"
    output_filename = f"pose_video_processed_{timestamp}"
    output_filepath = f"/app/project/core/res/output/{output_filename}.mp4"
    
    collection.update_one(
            {"pose_task_id": task_id},
            {"$set": {"pose_status": "PROCESSING"}}
        )
    
    try:
        process_pose_video_data(input_filepath, output_filepath)
        
        collection.update_one(
            {"pose_task_id": task_id},
            {"$set": {"pose_status": "GETTING_TOKEN"}}
        )
        
        # request token for uploading to ByteArk
        tokens_for_raw_video = get_upload_token(input_filename)
        tokens_for_processed_video = get_upload_token(output_filename)

        collection.update_one(
            {"pose_task_id": task_id},
            {"$set": {
                "pose_status": "UPLOADING",
                "pose_video": tokens_for_processed_video,
                "pose_video_raw": tokens_for_raw_video,
                }}
        )
        
        upload_video(input_filepath, tokens_for_raw_video[0])
        upload_video(output_filepath, tokens_for_processed_video[0])
        
        collection.update_one(
            {"pose_task_id": task_id},
            {"$set": {"pose_status": "UPLOADED"}}
        )
        
        return input_filepath, output_filepath
        
    except Exception as e:
        collection.update_one(
            {"pose_task_id": task_id},
            {"$set": {"pose_status": "FAILURE", "pose_error_message": str(e)}}
        )

@shared_task
def capture_pose_on_shot_detected(results, id):
    scoring_detail = results[0][0]
    raw_target_video_path = results[0][1]
    target_video_path = results[0][2]
    
    raw_pose_video_path = results[1][0]
    pose_video_path = results[1][1]
    
    try:
        # Upload hit frames
        scoring_detail_with_images = upload_frames(scoring_detail, target_video_path, pose_video_path)
        
        collection.update_one(
                {"_id": ObjectId(id)},
                {"$set": {
                    "score": scoring_detail_with_images,
                    "pose_status": "SUCCESS",
                    "target_status": "SUCCESS",
                    }}
            )
        
        delete_video(target_video_path)
        delete_video(pose_video_path)
        delete_video(raw_pose_video_path)
        delete_video(raw_target_video_path)
        
    except Exception as e:
        collection.update_one(
            {"_id": ObjectId(id)},
            {"$set": {
                "pose_status": "FAILURE",
                "pose_error_message": str(e),
                "target_status": "FAILURE",
                "target_error_message": str(e),
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
        
        if target_ret and pose_ret:
            _, target_buffer = cv2.imencode('.jpg', target_frame)
            target_image_stream = io.BytesIO(target_buffer)
            
            _, pose_buffer = cv2.imencode('.jpg', pose_frame)
            pose_image_stream = io.BytesIO(pose_buffer)
    
            # Upload the frame to Cloudinary
            target_upload_result = cloudinary.uploader.upload(target_image_stream, resource_type='image')
            pose_upload_result = cloudinary.uploader.upload(pose_image_stream, resource_type='image')
            
            hit_with_image = {**hit, 'target_image_url': target_upload_result['url'], 'pose_image_url': pose_upload_result['url']}
            scoring_detail_with_images.append(hit_with_image)
    return scoring_detail_with_images