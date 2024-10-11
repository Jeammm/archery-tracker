from project.core.target_scoring.VideoAnalyzer import VideoAnalyzer
from project.core.target_scoring.Sketcher import Sketcher
import cv2
from datetime import datetime

def process_target_video_data(input_filepath, output_filepath):
  # input
  model = cv2.imread('/app/project/core/res/input/target.jpg')
  video_name = input_filepath
  video_fps = 30
  bullseye_point = (325,309)
  inner_diameter_px = 50
  inner_diameter_inch = 1.5
  rings_amount = 6
  display_in_cm = True

  # calculate the sizes of the frame and the input
  pixel_to_inch = inner_diameter_inch / inner_diameter_px
  pixel_to_cm = pixel_to_inch * 2.54
  measure_unit = pixel_to_cm if display_in_cm else pixel_to_inch
  measure_unit_name = 'cm' if display_in_cm else '"'

  # analyze
  start_time = datetime.now()
  sketcher = Sketcher(measure_unit, measure_unit_name)
  video_analyzer = VideoAnalyzer(video_name, model, bullseye_point, rings_amount, inner_diameter_px)
  scoring_detail = video_analyzer.analyze(output_filepath, sketcher, start_time, video_fps)
  print("========== Score Result Processing Completed ===========")
  return scoring_detail