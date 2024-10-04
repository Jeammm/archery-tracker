from datetime import datetime
from bson.objectid import ObjectId
from flask import jsonify, request
from project.constants.constants import SESSION_COLLECTION
from .. import db
      
collection = db[SESSION_COLLECTION]
      
def get_sessions(user_id):
    try:
        query = {}
        if user_id:
            query['user_id'] = ObjectId(user_id)
            
        data = list(collection.find(query))
        
        for item in data:
            item['_id'] = str(item['_id'])
            item['user_id'] = str(item['user_id'])
        
        return jsonify(data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
      
def get_session_by_id(user_id, session_id):
    try:
        session = collection.find_one({'_id': ObjectId(session_id), "user_id": ObjectId(user_id)})
        if session:
            session['_id'] = str(session['_id'])
            session['user_id'] = str(session['user_id'])
            return jsonify(session)
        else:
            return jsonify({'error': 'Session not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def create_session(user_id):
    try:
        created_date = datetime.utcnow()
        task_data = {
            "user_id": ObjectId(user_id),
            "created_at": created_date,
            "target_status": "LIVE",
            "pose_status": "LIVE", 
        }
        result = collection.insert_one(task_data)
        
        return jsonify({
                "_id": str(result.inserted_id),
                "user_id": user_id,
                "created_at": created_date,
                 "target_status": "LIVE",
                "pose_status": "LIVE",
            }), 202
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500