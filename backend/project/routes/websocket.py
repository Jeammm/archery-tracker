from flask_socketio import SocketIO
from flask import request
from project.controllers.session_socket_controller import SessionSocketController

socketio = SocketIO(cors_allowed_origins="*", message_queue='redis://')
Sessions = SessionSocketController()

def init_websocket(app):
    return socketio.init_app(app)

@socketio.on('connect')
def handle_connect():
    print(f'websocket ID: {request.sid} connected')

@socketio.on('disconnect')
def handle_disconnect():
    user_id = request.sid
    Sessions.user_disconnect(user_id)
     
@socketio.on('startSession')
def on_join_session(data):    
    session_id = data['sessionId']
    user_id = request.sid
    Sessions.start_session(user_id, session_id)
    
@socketio.on('joinSession')
def on_join_session(data):    
    session_id = data['sessionId']
    user_id = request.sid
    Sessions.join_session(user_id, session_id)


@socketio.on('leaveSession')
def on_leave_session(data):
    session_id = data['sessionId']
    user_id = request.sid
    Sessions.user_leave_session(user_id, session_id)

@socketio.on('sessionEnd')
def on_session_end(data):
    session_id = data['sessionId']
    Sessions.end_session(session_id)
     
@socketio.on('recordingStarted')
def start_recording(data):
    session_id = data['sessionId']
    Sessions.start_recording(session_id)

@socketio.on('recordingStopped')
def stop_recording(data):
    session_id = data['sessionId']
    Sessions.stop_recording(session_id)
        
@socketio.on("targetVideoUploadProgress")
def target_video_upload_progress(data):
    session_id = data["sessionId"]
    uploading_status = data["uploadingStatus"]
    Sessions.update_target_upload_progress(session_id, uploading_status)
    
@socketio.on("targetVideoUploadDone")
def target_video_upload_completed(data):
    session_id = data["sessionId"]
    round_id = data["roundId"]
    Sessions.target_upload_completed(session_id, round_id)
