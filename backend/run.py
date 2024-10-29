from project import create_app
import eventlet

eventlet.monkey_patch()
app, celery, socketio = create_app()
app.app_context().push()

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000)