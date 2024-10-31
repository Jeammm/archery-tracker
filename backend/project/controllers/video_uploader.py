import requests
from celery import current_app
import os

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