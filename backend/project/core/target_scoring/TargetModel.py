def get_target_model_path(model):
  models = {
    "olympic_standard_target": {
      "model_path": "/app/project/core/res/input/olympic_standard_target.jpg",
      "measure_unit": 0.0762,
      "bullseye_point": [325, 309],
      "inner_diameter_px": 50,
      "inner_diameter_inch": 1.5,
      "rings_amount": 6,
      "model": "olympic_standard_target",
      "model_name": "Olympic Standard Target",
      "frame_size": [1080, 1920, 3],
      "model_size": [652, 613],
      }
  }
  
  return models[model]