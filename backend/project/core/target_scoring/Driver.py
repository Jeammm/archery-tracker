from project.core.target_scoring.TargetModel import get_target_model_path
from project.core.target_scoring.VideoAnalyzer import VideoAnalyzer
from project.core.target_scoring.Sketcher import Sketcher
import cv2
import numpy as np
from datetime import datetime, timezone
import requests

def process_target_video_data(input_filepath, output_filepath, model_data):
  # video input
  video_name = input_filepath
  video_fps = 30
  display_in_cm = True
  
  # model input
  image_url = model_data['model_path']
  response = requests.get(image_url)
  image_array = np.frombuffer(response.content, np.uint8)
  model = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
  bullseye_point = model_data['bullseye_point']
  inner_diameter_px = model_data['inner_diameter_px']
  inner_diameter_inch = model_data['inner_diameter_inch']
  rings_amount = model_data['rings_amount']

  # calculate the sizes of the frame and the input
  pixel_to_inch = inner_diameter_inch / inner_diameter_px
  pixel_to_cm = pixel_to_inch * 2.54
  measure_unit = pixel_to_cm if display_in_cm else pixel_to_inch
  measure_unit_name = 'cm' if display_in_cm else '"'

  # analyze
  start_time = datetime.now(timezone.utc)
  sketcher = Sketcher(measure_unit, measure_unit_name)
  video_analyzer = VideoAnalyzer(video_name, model, bullseye_point, rings_amount, inner_diameter_px)
  scoring_detail = video_analyzer.analyze(output_filepath, sketcher, start_time, video_fps)
  print("😇 Score Result Processing Completed 😇")
  return scoring_detail