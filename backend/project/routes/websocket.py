from flask_socketio import SocketIO, emit, join_room, leave_room
from flask import request

socketio = SocketIO()

active_sessions = {}

def find_user_in_sessions(user_id):
    for session_id, session_data in active_sessions.items():
        if user_id in session_data:
            return session_id
    return None

def init_websocket(app):
    return socketio.init_app(app)

@socketio.on('connect')
def handle_connect():
    print(f'websocket ID: {request.sid} connected')

@socketio.on('disconnect')
def handle_disconnect():
    user_id = request.sid
    session_id = find_user_in_sessions(user_id)
    
    if session_id and session_id in active_sessions:
        user_role = active_sessions[session_id].get(user_id)
        
        if user_role == "target_camera":
            print("target_camera_left")
            active_sessions[session_id].pop(user_id, None)
            emit('participant_leave', {'users': active_sessions[session_id]}, to=session_id)
        if user_role == "pose_camera":
            print("pose_camear_left")
            active_sessions.pop(session_id, None)
            emit('session_ended', {'message': 'The room has ended.'}, to=session_id)
     
@socketio.on('startSession')
def on_join_session(data):    
    session_id = data['sessionId']
    user_id = request.sid

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
        active_sessions.pop(session_id, None)
    
    leave_room(session_id)
    emit('session_ended', {'message': 'The room has ended.'}, to=session_id)
     
@socketio.on('recordingStarted')
def start_recording(data):
    session_id = data['sessionId']
    is_recording = False
    
    if session_id in active_sessions:
        is_recording = active_sessions[session_id]['is_recording']
    else:
        active_sessions[session_id]['is_recording'] = False
    
    if not is_recording:
        active_sessions[session_id]['is_recording'] = True
        emit('recordingStarted', {'message': 'Recording started!'}, to=session_id)
    else:
        emit('recordingStarted', {'message': 'Already recording!'}, to=session_id)

@socketio.on('recordingStopped')
def stop_recording(data):
    session_id = data['sessionId']
    is_recording = True
    
    if session_id in active_sessions:
        is_recording = active_sessions[session_id]['is_recording']
    else:
        active_sessions[session_id]['is_recording'] = True
    
    if not is_recording:
        active_sessions[session_id]['is_recording'] = False
        emit('recordingStarted', {'message': 'Recording started!'}, to=session_id)
    else:
        emit('recordingStarted', {'message': 'Already recording!'}, to=session_id)
