from flask import current_app
from flask_socketio import emit, join_room, leave_room
from bson.objectid import ObjectId
from datetime import datetime
from project.constants.constants import ROUND_COLLECTION

class SessionSocketController:
    def __init__(self):
        self.active_sessions = {}
        '''
        <Dict<string, string>[]> users - user list in the active session
        <Round> round_data - round data that associate with this session
        '''
    
    def is_session_exist(self, session_id):
        if session_id in self.active_sessions:
          return True
        return False

    def find_user_in_sessions(self, user_id):
        for session_id, session_data in self.active_sessions.items():
            if 'users' in session_data and user_id in session_data['users']:
                return session_id
        return None
    
    def discard_current_round(self, session_id):
        db = current_app.config['db']
        collection = db[ROUND_COLLECTION]
        
        if not self.is_session_exist(session_id):
          return

        if 'round_data' in self.active_sessions[session_id]:
            current_round = self.active_sessions[session_id]['round_data']
            collection.delete_one({'_id': ObjectId(current_round['_id'])})
            emit('discard_current_round', {'message': 'Round Discarded'}, to=session_id)
            self.active_sessions[session_id].pop('round_data', None)
          
    def user_disconnect(self, user_id):
        session_id = self.find_user_in_sessions(user_id)
        
        if not session_id or not self.is_session_exist(session_id):
          return
        
        if 'round_data' in self.active_sessions[session_id]:
          self.discard_current_round(session_id)
        
        user_role = self.active_sessions[session_id]['users'].get(user_id)
        
        if user_role == "target_camera":
            self.active_sessions[session_id]['users'].pop(user_id, None)
            emit('participant_leave', {'users': self.active_sessions[session_id]['users']}, to=session_id)
        
        if user_role == "pose_camera":
            self.active_sessions.pop(session_id, None)
            emit('session_ended', {'message': 'The room has ended.'}, to=session_id)
          
    def start_session(self, user_id, session_id):
        if not self.is_session_exist(session_id):
            self.active_sessions[session_id] = {'users': {user_id: 'pose_camera'}}

        join_room(session_id)
        emit('participant_join', {'users': self.active_sessions[session_id]['users']}, to=session_id)
    
    def join_session(self, user_id, session_id):
        if self.is_session_exist(session_id):
            self.active_sessions[session_id]['users'][user_id] = "target_camera"
            join_room(session_id)
            emit('participant_join', {'users': self.active_sessions[session_id]['users']}, to=session_id)
        else:
            emit('session_not_found', to=user_id)
    
    def user_leave_session(self, user_id, session_id):
        if self.is_session_exist(session_id):
            self.active_sessions[session_id]['users'].pop(user_id, None)
            self.active_sessions[session_id].pop('round_data', None)
        
        leave_room(session_id)
        emit('participant_leave', {'users': self.active_sessions[session_id]['users']}, to=session_id)
        
    def end_session(self, session_id):
        if not self.is_session_exist(session_id):
            return
        
        if 'round_data' in self.active_sessions[session_id]:
            self.discard_current_round(session_id)
            self.active_sessions.pop(session_id, None)
        
        leave_room(session_id)
        emit('session_ended', {'message': 'The room has ended.'}, to=session_id)
    
    def start_recording(self, session_id):
        db = current_app.config['db']
        collection = db[ROUND_COLLECTION]

        if not self.is_session_exist(session_id):
            return

        if 'round_data' in self.active_sessions[session_id]:
            emit('recordingStarted', {'message': 'Already recording!'}, to=session_id)
            return
          
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

        self.active_sessions[session_id]['round_data'] = response_data
        emit('recordingStarted', {'round_data': response_data}, to=session_id)
        
    def stop_recording(self, session_id):
        if not self.is_session_exist(session_id):
            return
        
        self.active_sessions[session_id].pop('round_data', None)
        
        emit('recordingStopped', {'message': 'Recording stoped!'}, to=session_id)
    
    def update_target_upload_progress(self, session_id, uploading_status):        
        emit('targetVideoUploadProgress', {"uploading_status": uploading_status}, to=session_id)
            