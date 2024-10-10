from flask_socketio import SocketIO
from flask import request

socketio = SocketIO()

def init_websocket(app):
    return socketio.init_app(app)

@socketio.on('connect')
def handle_connect():
    print(f'websocket ID: {request.sid} connected')

@socketio.on('disconnect')
def handle_disconnect():
     print(f'websocket ID: {request.sid} disconnected')
