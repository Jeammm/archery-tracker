from flask_socketio import SocketIO, emit
from flask import request

socketio = SocketIO()

is_recording = False

def init_websocket(app):
    return socketio.init_app(app)

@socketio.on('connect')
def handle_connect():
    print(f'websocket ID: {request.sid} connected')

@socketio.on('disconnect')
def handle_disconnect():
     print(f'websocket ID: {request.sid} disconnected')
     
@socketio.on('recordingStarted')
def start_recording():
    global is_recording
    if not is_recording:
        is_recording = True
        emit('recordingStarted', {'message': 'Recording started!'}, broadcast=True)
    else:
        emit('recordingStarted', {'message': 'Already recording!'}, broadcast=True)

@socketio.on('recordingStopped')
def stop_recording():
    global is_recording
    if is_recording:
        is_recording = False
        emit('recordingStopped', {'message': 'Recording stopped!'}, broadcast=True)
    else:
        emit('recordingStopped', {'message': 'Not currently recording!'}, broadcast=True)
