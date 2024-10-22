from datetime import datetime, timedelta
from project.controllers.session_controller import add_rounds_to_sessions, convert_object_ids
from bson.objectid import ObjectId
from flask import jsonify
from project.constants.constants import SESSION_COLLECTION
from ..db import db

collection = db[SESSION_COLLECTION]

def calculate_sum_training_time(sessions):
    sum_session_time = 0
    
    for session in sessions:
        if 'total_session_time' in session:
            sum_session_time += session.get('total_session_time')
    
    return sum_session_time

def calculate_sum_round_count(sessions):
    return sum(len(session['round_result']) for session in sessions)

def calculate_average_accuracy(sessions):
    round_count = calculate_sum_round_count(sessions)
    if (round_count == 0):
        return 0
    
    return round(sum(session['accuracy'] for session in sessions) / round_count * 10, 2)
    
      
def get_stat(user_id):
    try:
        now = datetime.now()
        start_of_current_week = now - timedelta(days=7)
        end_of_current_week = now

        start_of_last_week = now - timedelta(days=14)
        end_of_last_week = now - timedelta(days=7)
        
        current_week_query = {
            'user_id': ObjectId(user_id),
            'created_at': {
                '$gte': start_of_current_week,
                '$lte': end_of_current_week
            }
        }

        last_week_query = {
            'user_id': ObjectId(user_id),
            'created_at': {
                '$gte': start_of_last_week,
                '$lte': end_of_last_week
            }
        }
            
        current_week_sessions = list(collection.find(current_week_query).sort('created_at', -1))
        current_week_sessions = convert_object_ids(current_week_sessions)
        current_week_sessions = add_rounds_to_sessions(current_week_sessions)
        
        last_week_sessions = list(collection.find(last_week_query).sort('created_at', -1))
        last_week_sessions = convert_object_ids(last_week_sessions)
        last_week_sessions = add_rounds_to_sessions(last_week_sessions)
        
        
        current_week_training_time = calculate_sum_training_time(current_week_sessions)
        last_week_training_time = calculate_sum_training_time(last_week_sessions)
        total_training_time_compare =  current_week_training_time - last_week_training_time
        
        current_week_round_count = calculate_sum_round_count(current_week_sessions)
        last_week_round_count = calculate_sum_round_count(last_week_sessions)
        total_round_count_campare =  current_week_round_count - last_week_round_count
        
        current_week_accuracy = calculate_average_accuracy(current_week_sessions)
        last_week_accuracy = calculate_average_accuracy(last_week_sessions)
        total_accuracy_compare = current_week_accuracy - last_week_accuracy
        
        stats_data = {
            'total_training_time_compare' : {'compare': total_training_time_compare, 'current_week': current_week_training_time, 'last_week': last_week_training_time},
            'total_round_count_campare' : {'compare': total_round_count_campare, 'current_week': current_week_round_count, 'last_week': last_week_round_count},
            'total_accuracy_compare' : {'compare': total_accuracy_compare, 'current_week': current_week_accuracy, 'last_week': last_week_accuracy}
        }
        
        return jsonify(stats_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
