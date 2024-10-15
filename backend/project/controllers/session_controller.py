from datetime import datetime
from bson.objectid import ObjectId
from flask import jsonify, request
from project.constants.constants import SESSION_COLLECTION, ROUND_COLLECTION
from ..db import db
      
collection = db[SESSION_COLLECTION]

def add_rounds_to_sessions(sessions):
    """Helper function to add round results to each session."""
    for session in sessions:
        session_id = session['_id']
        # Fetch rounds for this session
        rounds = list(db[ROUND_COLLECTION].find({"session_id": ObjectId(session_id)}))
        # Convert ObjectIds to strings for each round item
        for round_item in rounds:
            round_item['_id'] = str(round_item['_id'])
            round_item['session_id'] = str(round_item['session_id'])
        session['round_result'] = rounds
    return sessions

def convert_object_ids(data):
    """Helper function to convert ObjectId fields to strings."""
    for item in data:
        item['_id'] = str(item['_id'])
        if 'user_id' in item:
            item['user_id'] = str(item['user_id'])
    return data

def get_sessions(user_id):
    try:
        query = {}
        if user_id:
            query['user_id'] = ObjectId(user_id)
            
        sessions = list(collection.find(query).sort('created_at', -1))
        sessions = convert_object_ids(sessions)
        sessions = add_rounds_to_sessions(sessions)
        
        return jsonify(sessions)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def get_session_by_id(user_id, session_id):
    try:
        session = collection.find_one({'_id': ObjectId(session_id), 'user_id': ObjectId(user_id)})
        if session:
            session = convert_object_ids([session])[0]
            session = add_rounds_to_sessions([session])[0]
            return jsonify(session)
        else:
            return jsonify({'error': 'Session not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def create_session(user_id):
    try:
        data = request.json
        # Check if 'model' is present in the request body
        if 'model' not in data:
            return jsonify({'error': 'Model is required in the request body'}), 400
        
        model = data['model']
        created_date = datetime.utcnow()
        task_data = {
            "user_id": ObjectId(user_id),
            "created_at": created_date,
            "model": model,
            "session_status": "STARTED"
        }
        result = collection.insert_one(task_data)
        
        return jsonify({
                "_id": str(result.inserted_id),
                "user_id": user_id,
                "created_at": created_date,
                "model": model,
                "session_status": "STARTED"
            }), 202
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
def end_session_by_id(user_id, session_id):
    try:
        session = collection.find_one({'_id': ObjectId(session_id), 'user_id': ObjectId(user_id)})
        if session:
            collection.update_one(
                {"_id": session_id},
                {"$set": {"session_status": "ENDED"}}
            )
            session = convert_object_ids([session])[0]
            session = add_rounds_to_sessions([session])[0]
            return jsonify(session)
        else:
            return jsonify({'error': 'Session not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500