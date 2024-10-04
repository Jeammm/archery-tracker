from bson.objectid import ObjectId
from flask import jsonify
from project.constants.constants import SESSION_COLLECTION
from .. import db
      
def get_stat(user_id):
    try:
        query = {}
        if user_id:
            query['user_id'] = user_id

        collection = db[SESSION_COLLECTION]
        data = list(collection.find(query))
        
        total_accuracy = 0
        session_count = 0
        
        for session in data:
            if session["target_status"] != "SUCCESS" or "score" not in session:
                continue
            
            session['_id'] = str(session['_id'])
            
            session_count += 1
            session_sum_score = 0
            
            for shot in session["score"]:
                session_sum_score += shot["score"]
            session_accuracy = session_sum_score / len(session["score"]) / 10
            
            session['sum_score'] = session_sum_score
            session['accuracy'] = session_accuracy
            total_accuracy += session_accuracy
            
        stat_detail = {
            "sessions": data,
            "accuacy": session_accuracy / session_count / 10
        }
        
        return jsonify(stat_detail)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
