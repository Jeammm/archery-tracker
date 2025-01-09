from datetime import datetime
from bson.objectid import ObjectId
from datetime import timezone
from flask import jsonify, request
from project.constants.constants import SESSION_COLLECTION, ROUND_COLLECTION
from ..db import db

collection = db[SESSION_COLLECTION]

def sort_hit_by_id(round_item):
    if 'score' in round_item and isinstance(round_item['score'], list):
        sorted_hit = sorted(round_item['score'], key=lambda x: x["id"])
        round_item['score'] = sorted_hit
    
    return round_item

def add_rounds_to_sessions(sessions):
    """Helper function to add round results to each session and determine processing status."""
    for session in sessions:
        session_id = session['_id']
        # Fetch rounds for this session
        rounds = list(db[ROUND_COLLECTION].find({"session_id": ObjectId(session_id)}))
        # Convert ObjectIds to strings for each round item

        total_score = 0
        maximum_score = 0
        
        total_feature = {}
        feature_count = 0
        
        round_time = 0
        
        for round_item in rounds:
            round_item = sort_hit_by_id(round_item)
            round_item['_id'] = str(round_item['_id'])
            round_item['session_id'] = str(round_item['session_id'])
            
            
            scores = [hit['score'] for hit in round_item.get('score', []) if 'score' in hit]
            features = [hit['features'] for hit in round_item.get('score', []) if 'features' in hit]
            round_tts = [hit['tts'] for hit in round_item.get('score', []) if 'tts' in hit and hit['tts'] > 0]
            round_total_score = sum(scores)
            round_maximum_score = len(scores) * 10
            round_accuracy = round_total_score / round_maximum_score if round_maximum_score > 0 else 0 
            
            start_time = round_item.get('created_at')
            end_time = round_item.get('start_process_at') 
            
            if start_time and end_time:
                if isinstance(start_time, str):
                    start_time = datetime.strptime(start_time, '%Y-%m-%d %H:%M:%S')  # Adjust format as needed
                if isinstance(end_time, str):
                    end_time = datetime.strptime(end_time, '%Y-%m-%d %H:%M:%S')  # Adjust format as needed

                round_time += (end_time - start_time).total_seconds()
                round_item['round_time'] = (end_time - start_time).total_seconds()
                round_item['round_tts'] = sum(round_tts) / len(round_tts) if len(round_tts) > 0 else 0
            
            for feature in features:
                feature_count += 1
                for key, value in feature.items():
                    if key not in total_feature:
                        total_feature[key] = 0
                    total_feature[key] += value
            
            round_item['total_score'] = round_total_score
            round_item['maximum_score'] = round_maximum_score
            round_item['accuracy'] = round_accuracy  
            
            total_score += round_total_score
            maximum_score += round_maximum_score
            
        session['total_score'] = total_score
        session['maximum_score'] = maximum_score
        session['accuracy'] = total_score / maximum_score if maximum_score > 0 else 0
        session['round_result'] = rounds
        session['total_session_time'] = round_time
        
        all_round_tts_with_value = [round['round_tts'] for round in rounds if 'round_tts' in round and round['round_tts'] > 0]
        session['average_tts'] = (
            sum(all_round_tts_with_value) / len(all_round_tts_with_value)
            if all_round_tts_with_value
            else 0
        )
        
        for key in total_feature:
            total_feature[key] = round(total_feature[key] / feature_count, 2)
        session['features'] = total_feature
        
        # Determine processing status based on pose_status and target_status
        processing_status = "SUCCESS"
        for round_item in rounds:
            if round_item.get('pose_status') == "FAILURE" or round_item.get('target_status') == "FAILURE":
                processing_status = "FAILURE"
                break
            
            if round_item.get('pose_status') != "SUCCESS" or round_item.get('target_status') != "SUCCESS":
                processing_status = "PROCESSING"
                break
            
        session['processing_status'] = processing_status
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
        if session := collection.find_one(
            {'_id': ObjectId(session_id), 'user_id': ObjectId(user_id)}
        ):
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
        created_date = datetime.now(timezone.utc)
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
        rounds = list(db[ROUND_COLLECTION].find({"session_id": ObjectId(session_id)}))

        if session and not rounds:
            collection.delete_one({"_id": ObjectId(session_id)})
            return jsonify({'message': 'session ended with no round, deleted complete'})
        elif session:
            collection.update_one(
                {"_id": ObjectId(session_id)},
                {"$set": {"session_status": "ENDED"}}
            )
            session = convert_object_ids([session])[0]
            session = add_rounds_to_sessions([session])[0]
            return jsonify(session)
        else:
            return jsonify({'error': 'Session not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500