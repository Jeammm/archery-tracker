from celery import shared_task
from project.controllers.processing_controller import find_aiming_frame_from_shot, upload_frames
from project.constants.constants import ROUND_COLLECTION, SESSION_COLLECTION, MODEL_COLLECTION
from project.controllers.video_uploader import format_video_before_upload, get_short_playback_url, get_upload_token, upload_video, delete_video
from project.core.pose_estimation.Driver import process_pose_video_data
from project.core.target_scoring.Driver import process_target_video_data
from bson.objectid import ObjectId
from celery import current_app
from ..db import db

round_collection = db[ROUND_COLLECTION]
session_collection = db[SESSION_COLLECTION]
model_collection = db[MODEL_COLLECTION]

pose_video_control = current_app.conf['POSE_VIDEO_CONTROL_URL']
target_video_control = current_app.conf['TARGET_VIDEO_CONTROL_URL']
pose_video_demo1 = current_app.conf['POSE_VIDEO_DEMO1_URL']
target_video_demo1 = current_app.conf['TARGET_VIDEO_DEMO1_URL']
pose_video_demo2 = current_app.conf['POSE_VIDEO_DEMO2_URL']
target_video_demo2 = current_app.conf['TARGET_VIDEO_DEMO2_URL']
pose_video_demo3 = current_app.conf['POSE_VIDEO_DEMO3_URL']
target_video_demo3 = current_app.conf['TARGET_VIDEO_DEMO3_URL']

class MissingTargetModelError(Exception):
    pass
class ModelNotExistError(Exception):
    pass

# video argument can be
# 1. 'user' = real user data
# 2. 'control' = best video for the app
# 3. 'demo1' = video 1 from KU archery club
# 4. 'demo2' = video 2 from KU archery club
# 4. 'demo3' = video 3 from KU archery club
def get_testing_video_source(round_id, video):
    if (video == 'control'):
        return [target_video_control, pose_video_control]
    elif (video == 'demo1'):
        return [target_video_demo1, pose_video_demo1]
    elif (video == 'demo2'):
        return [target_video_demo2, pose_video_demo2]
    elif (video == 'demo3'):
        return [target_video_demo3, pose_video_demo3]
    
    return [f"target_video_raw_{round_id}", f"pose_video_raw_{round_id}"]

@shared_task(bind=True)
def process_target_test(self, round_id, video):
    task_id = self.request.id
    
    input_filename = f"target_video_raw_{round_id}"
    input_filepath = get_testing_video_source(round_id, video)[0]
    dummy_input_filepath = f"/app/project/core/res/output/{input_filename}.webm"
    output_filename = f"target_video_processed_{round_id}"
    output_filepath = f"/app/project/core/res/output/{output_filename}.mp4"
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
        
        scoring_detail = process_target_video_data(input_filepath, output_filepath, existing_model)
        
        round_collection.update_one(
            {"target_task_id": task_id},
            {"$set": {"target_status": "GETTING_TOKEN", "score": scoring_detail}}
        )
        
        # Compress the videos
        format_video_before_upload(output_filepath, compressed_output_filepath)
        
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
        
        # upload_video(input_filepath, tokens_for_raw_video[0])
        upload_video(compressed_output_filepath, tokens_for_processed_video[0])
        
        
        round_collection.update_one(
            {"target_task_id": task_id},
            {"$set": {"target_status": "SUCCESS"}}
        )
        
        return scoring_detail, input_filepath, output_filepath, dummy_input_filepath, compressed_output_filepath
        
    except Exception as e:
        round_collection.update_one(
            {"target_task_id": task_id},
            {"$set": {"target_status": "FAILURE", "target_error_message": str(e)}}
        )

@shared_task(bind=True)
def process_pose_test(self, round_id, video):
    task_id = self.request.id
    
    input_filename = f"pose_video_raw_{round_id}"
    input_filepath = get_testing_video_source(round_id, video)[1]
    dummy_input_filepath = f"/app/project/core/res/output/{input_filename}.webm"
    output_filename = f"pose_video_processed_{round_id}"
    output_filepath = f"/app/project/core/res/output/{output_filename}.mp4"
    compressed_output_filepath = f"/app/project/core/res/output/compressed_{output_filename}.mp4"

    
    round_collection.update_one(
            {"pose_task_id": task_id},
            {"$set": {"pose_status": "PROCESSING"}}
        )
    
    try:
        aiming_frames = process_pose_video_data(input_filepath, output_filepath)
        
        round_collection.update_one(
            {"pose_task_id": task_id},
            {"$set": {"pose_status": "GETTING_TOKEN"}}
        )
        
        # Compress the videos
        format_video_before_upload(output_filepath, compressed_output_filepath)
        
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
        
        # upload_video(input_filepath, tokens_for_raw_video[0])
        upload_video(compressed_output_filepath, tokens_for_processed_video[0])
        
        round_collection.update_one(
            {"pose_task_id": task_id},
            {"$set": {"pose_status": "SUCCESS"}}
        )
        
        return input_filepath, output_filepath, dummy_input_filepath, aiming_frames, compressed_output_filepath
        
    except Exception as e:
        round_collection.update_one(
            {"pose_task_id": task_id},
            {"$set": {"pose_status": "FAILURE", "pose_error_message": str(e)}}
        )

@shared_task(bind=True, max_retries=3, default_retry_delay=30)
def capture_pose_on_shot_detected_test(self, results, round_id):
    scoring_detail = results[0][0]
    target_video_path = results[0][2]
    dummy_raw_target_video_path = results[0][3]
    compressed_target_video_path = results[0][4]
    
    pose_video_path = results[1][1]
    dummy_raw_pose_video_path = results[1][2]
    aiming_frames = results[1][3]
    compressed_pose_video_path = results[1][4]
    
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
        delete_video(dummy_raw_pose_video_path)
        delete_video(dummy_raw_target_video_path)
        delete_video(compressed_target_video_path)
        delete_video(compressed_pose_video_path)
        
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
  