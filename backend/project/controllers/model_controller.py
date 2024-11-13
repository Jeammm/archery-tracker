from datetime import datetime, timezone
from project.constants.constants import ACCOUNT_COLLECTION, MODEL_COLLECTION
from bson.objectid import ObjectId
from flask import jsonify, request
from ..db import db
import cloudinary.uploader

model_collection = db[MODEL_COLLECTION]
account_collection = db[ACCOUNT_COLLECTION]

def add_creator_to_models(models):
    """Helper function to add round results to each session and determine processing status."""
    for model in models:
        creator_id = model['created_by']
        creator = account_collection.find_one({"_id": ObjectId(creator_id)})
        model['created_by'] = creator['name']
        
        if "updated_by" in model:
            updater_id = model['updated_by']
            updater = account_collection.find_one({"_id": ObjectId(updater_id)})
            model['updated_by'] = updater['name']
            
    return models

def convert_object_ids(data):
    """Helper function to convert ObjectId fields to strings."""
    for item in data:
        item['_id'] = str(item['_id'])
    return data

def get_models(user_id):
    try:            
        models = list(model_collection.find({}))
        models = add_creator_to_models(models)
        models = convert_object_ids(models)
        return jsonify(models)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def get_model_by_name(user_id, model):
    try:
        if model := model_collection.find_one({'model': model}):
            model = add_creator_to_models([model])[0]
            model = convert_object_ids([model])[0]
            return jsonify(model)
        else:
            return jsonify({'error': 'Model not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def create_model(user_id):
    try:
        form = request.form
        image = request.files.get("image")
        model_name = form.get("modelName")
        bullseye_point_x = form.get("bullseyePointX")
        bullseye_point_y = form.get("bullseyePointY")
        inner_diameter = form.get("innerDiameter")
        rings_amount = form.get("ringsAmount")

        if not image or not model_name or not bullseye_point_x or not bullseye_point_y or not inner_diameter or not rings_amount:
            return jsonify({'error': 'Model data in the request body is not completed'}), 400

        # Upload the image to Cloudinary
        upload_result = cloudinary.uploader.upload(image, resource_type='image')

        # Get the URL of the uploaded image
        image_url = upload_result.get("secure_url")
        image_width = upload_result.get("width")
        image_height = upload_result.get("height")

        created_date = datetime.now(timezone.utc)
        model_data = {
            "model_path": image_url,
            "bullseye_point": [int(bullseye_point_x), int(bullseye_point_y)],
            "inner_diameter_px": int(inner_diameter),
            "inner_diameter_inch": 1.5,
            "rings_amount": int(rings_amount),
            "model_name": model_name,
            "model": "_".join(model_name.lower().split(" ")),
            "created_at": created_date,
            "model_size": [int(image_width), int(image_height)],
            "created_by": ObjectId(user_id)
        }
        result = model_collection.insert_one(model_data)

        return jsonify({
                "_id": str(result.inserted_id),
                "created_at": created_date,
                "model": model_name,
            }), 202

    except Exception as e:
        return jsonify({'error': str(e)}), 500

def update_model_by_id(user_id, model_id):
    try:
        form = request.form
        model_name = form.get("modelName")
        bullseye_point_x = form.get("bullseyePointX")
        bullseye_point_y = form.get("bullseyePointY")
        inner_diameter = form.get("innerDiameter")
        rings_amount = form.get("ringsAmount")

        if not model_name or not bullseye_point_x or not bullseye_point_y or not inner_diameter or not rings_amount:
            return jsonify({'error': 'Model data in the request body is not completed'}), 400

        if model := model_collection.find_one({'_id': ObjectId(model_id)}):
            updated_model_data = {
                "bullseye_point": [int(bullseye_point_x), int(bullseye_point_y)],
                "inner_diameter_px": int(inner_diameter),
                "inner_diameter_inch": 1.5,
                "rings_amount": int(rings_amount),
                "model_name": model_name,
                "model": "_".join(model_name.lower().split(" ")),
                "updated_by": ObjectId(user_id)
            }
            result = model_collection.update_one({'_id': model["_id"]}, {'$set': updated_model_data})

            return jsonify({
                    "_id": model_id,
                    "model": model_name,
                }), 202
            
        else:
            return jsonify({'error': 'Model not found'}), 404


    except Exception as e:
        return jsonify({'error': str(e)}), 500
