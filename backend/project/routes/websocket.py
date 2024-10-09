from flask_socketio import SocketIO

socketio = SocketIO()

def init_websocket(app):
    return socketio.init_app(app)

@socketio.on('connect')
def handle_connect():
    print('Client connected')

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

@socketio.on('message')
def handle_message(data):
    print('Message received: ', data)
    socketio.send('Message received')
    
@socketio.on("video_frame_pose")
def handle_video(image):
    print(image)
    print("=================== here =====================")