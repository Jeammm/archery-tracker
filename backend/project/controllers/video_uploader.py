import requests
from celery import current_app
import os
import subprocess

def get_upload_token(video_name):
    response = requests.post(
        "https://stream.byteark.com/api/v1/videos",
        headers={
            "Authorization": f"Bearer {current_app.conf['BYTEARK_TOKEN']}",
            "Content-Type": "application/json"
        },
        json={
            "projectKey": current_app.conf['BYTEARK_PROJECT_KEY'],
            "videos": [
                {
                    "title": video_name,
                }
            ]
        }
    )
    # response.raise_for_status()  # Ensure we notice bad responses
    return response.json()

def get_short_playback_url(tokens):
    return [{"playbackUrls": tokens[0]["playbackUrls"]}]

def upload_video(file_path, token):
    with open(file_path, 'rb') as video_file:
        files = {
            'file': (file_path.split('/')[-1], video_file, 'video/mp4')
        }
        
        headers = {
            "Authorization": f"Bearer {current_app.conf['BYTEARK_TOKEN']}"
        }
        
        response = requests.post(
            f"https://stream.byteark.com/api/upload/v1/form-data/videos/{token['key']}",
            headers=headers,
            files=files
        )
        
    return response.json()

def delete_video(file_path):
    if os.path.exists(file_path):
        os.remove(file_path)
        
def format_video_before_upload(input_file: str, output_file: str):
    command = [
        "ffmpeg", "-i", input_file,
        "-c:v", "libx264", "-preset", "medium", "-crf", "23",
        "-c:a", "aac", "-b:a", "128k",
        output_file
    ]
    subprocess.run(command, check=True)
    
def check_and_trim_video(type, video_timestamp, input_path, trimmed_path):
    """
    Check video timestamps and trim the video using FFmpeg.

    Args:
        type (str): The type of video ('pose' or 'target').
        video_timestamp (dict): A dictionary containing 'pose' and 'target' timestamps.
        input_path (str): The path to the input video.
        trimmed_path (str): The path to save the trimmed video.
    """
    pose_timestamp = int(video_timestamp['pose'])
    target_timestamp = int(video_timestamp['target'])

    print("&&&&&&&&&&&&&&&&&&")
    print(video_timestamp)
    print(pose_timestamp)
    print(target_timestamp)
    print("&&&&&&&&&&&&&&&&&&")

    video_to_trim_type = ""

    if pose_timestamp == 0 or target_timestamp == 0:
        # No trimming needed, just rename the file
        os.rename(input_path, trimmed_path)
        return

    if type == 'pose' and pose_timestamp < target_timestamp:
        video_to_trim_type = "pose"

    if type == 'target' and target_timestamp < pose_timestamp:
        video_to_trim_type = "target"

    if not video_to_trim_type:
        # If both timestamps are fine, just rename the file
        os.rename(input_path, trimmed_path)
        return

    # Calculate time difference and set trimming points
    time_diff = abs(pose_timestamp - target_timestamp) / 1000  # Convert ms to seconds
    start_time = min(pose_timestamp, target_timestamp) / 1000  # Convert ms to seconds

    # FFmpeg command to trim the video
    command = [
        "ffmpeg",
        "-i", input_path,                # Input file
        "-ss", str(start_time),           # Start trimming from this time (in seconds)
        "-t", str(time_diff),             # Duration to trim (in seconds)
        "-c:v", "libx264",                # Use H.264 codec for video
        "-c:a", "aac",                    # Use AAC codec for audio
        "-b:a", "128k",                   # Set audio bitrate
        "-preset", "medium",              # Compression preset
        trimmed_path                      # Output file
    ]

    try:
        subprocess.run(command, check=True)
        print(f"{video_to_trim_type} video trimmed 🤩")
    except subprocess.CalledProcessError as e:
        print(f"Error during trimming: {e}")