from datetime import datetime
from flask_socketio import SocketIO, emit, join_room, leave_room
from bson.objectid import ObjectId
from flask import jsonify, request, current_app
from project.constants.constants import ROUND_COLLECTION

socketio = SocketIO()
active_sessions = {}

def find_user_in_sessions(user_id):
    for session_id, session_data in active_sessions.items():
        if user_id in session_data:
            return session_id
    return None

def init_websocket(app):
    return socketio.init_app(app)

def discard_current_round(session_id):
    db = current_app.config['db']
    collection = db[ROUND_COLLECTION]
    if session_id in active_sessions and 'round_data' in active_sessions[session_id]:
        current_round = active_sessions[session_id]['round_data']
        print(f"=== discarding round: {current_round['_id']} ")
        collection.delete_one({'_id': ObjectId(current_round['_id'])})
        emit('discard_current_round', {'message': 'Lost camera connection, this round will be discarded'}, to=session_id)

@socketio.on('connect')
def handle_connect():
    print(f'websocket ID: {request.sid} connected')

@socketio.on('disconnect')
def handle_disconnect():
    user_id = request.sid
    session_id = find_user_in_sessions(user_id)
    
    if session_id and session_id in active_sessions:
        user_role = active_sessions[session_id].get(user_id)
        
        discard_current_round(session_id)
        
        if user_role == "target_camera":
            active_sessions[session_id].pop(user_id, None)
            emit('participant_leave', {'users': active_sessions[session_id]}, to=session_id)
        if user_role == "pose_camera":
            active_sessions.pop(session_id, None)
            emit('session_ended', {'message': 'The room has ended.'}, to=session_id)
        
     
@socketio.on('startSession')
def on_join_session(data):    
    session_id = data['sessionId']
    user_id = request.sid
    
    if session_id not in active_sessions:
        active_sessions[session_id] = {"is_recording": False}
        active_sessions[session_id][user_id] = "pose_camera"

    join_room(session_id)
    emit('participant_join', {'users': active_sessions[session_id]}, to=session_id)
    
@socketio.on('joinSession')
def on_join_session(data):    
    session_id = data['sessionId']
    user_id = request.sid

    if session_id in active_sessions:
        active_sessions[session_id][user_id] = "target_camera"
        join_room(session_id)
        emit('participant_join', {'users': active_sessions[session_id]}, to=session_id)
    else:
        emit('session_not_found', to=user_id)


@socketio.on('leaveSession')
def on_leave_session(data):
    session_id = data['sessionId']
    user_id = request.sid

    if session_id in active_sessions:
        active_sessions[session_id].pop(user_id, None)
    
    leave_room(session_id)
    emit('participant_leave', {'users': active_sessions[session_id]}, to=session_id)

@socketio.on('sessionEnd')
def on_session_end(data):
    session_id = data['sessionId']
    
    if session_id in active_sessions:
        discard_current_round(session_id)
        active_sessions.pop(session_id, None)
    
    leave_room(session_id)
    emit('session_ended', {'message': 'The room has ended.'}, to=session_id)
     
@socketio.on('recordingStarted')
def start_recording(data):
    db = current_app.config['db']
    collection = db[ROUND_COLLECTION]
    session_id = data['sessionId']
    is_recording = False

    if session_id in active_sessions:
        is_recording = active_sessions[session_id]['is_recording']
    else:
        active_sessions[session_id]['is_recording'] = False

    if not is_recording:
        active_sessions[session_id]['is_recording'] = True

        created_date = datetime.utcnow()

        round_data = {
            "session_id": ObjectId(session_id),
            "created_at": created_date,
            "target_status": "LIVE",
            "pose_status": "LIVE",
        }
        result = collection.insert_one(round_data)

        # Prepare the data as a dictionary for emitting
        response_data = {
            "_id": str(result.inserted_id),
            "session_id": session_id,
            "created_at": str(created_date),
            "target_status": "LIVE",
            "pose_status": "LIVE",
        }

        # Emit the dictionary directly, without wrapping it in a response
        active_sessions[session_id]['round_data'] = response_data
        emit('recordingStarted', {'round_data': response_data}, to=session_id)
    else:
        emit('recordingStarted', {'message': 'Already recording!'}, to=session_id)

@socketio.on('recordingStopped')
def stop_recording(data):
    session_id = data['sessionId']
    
    if session_id not in active_sessions:
        active_sessions[session_id]['is_recording'] = True
    
    active_sessions[session_id]['is_recording'] = False
    active_sessions[session_id].pop('round_data', None)
    
    emit('recordingStopped', {'message': 'Recording stoped!'}, to=session_id)
        
@socketio.on("targetVideoUploadProgress")
def target_video_upload_complete(data):
    session_id = data["sessionId"]
    uploading_status = data["uploadingStatus"]
    
    emit('targetVideoUploadProgress', {"uploading_status": uploading_status}, to=session_id)
