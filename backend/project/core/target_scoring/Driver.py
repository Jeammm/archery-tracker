from project.core.target_scoring.VideoAnalyzer import VideoAnalyzer
from project.core.target_scoring.Sketcher import Sketcher
from project.core.target_scoring import utils
import cv2
from datetime import datetime

def process_target_video_data(output_filepath):
  # input
  model = cv2.imread('/app/project/core/res/input/target.jpg')
  video_name = 'https://jeamujvtudx.stream-playlist.byteark.com/streams/UOAurenzTkiT/playlist.m3u8'
  video_fps = 30
  bullseye_point = (325,309)
  inner_diameter_px = 50
  inner_diameter_inch = 1.5
  rings_amount = 6
  display_in_cm = True

  # get a sample frame from the video
  cap = cv2.VideoCapture(video_name)
  _, test_sample = cap.read()

  # calculate the sizes of the frame and the input
  model_h, model_w, _ = model.shape
  frame_h, frame_w, _ = test_sample.shape
  pixel_to_inch = inner_diameter_inch / inner_diameter_px
  pixel_to_cm = pixel_to_inch * 2.54
  measure_unit = pixel_to_cm if display_in_cm else pixel_to_inch
  measure_unit_name = 'cm' if display_in_cm else '"'

  # analyze
  start_time = datetime.now()
  sketcher = Sketcher(measure_unit, measure_unit_name)
  video_analyzer = VideoAnalyzer(video_name, model, bullseye_point, rings_amount, inner_diameter_px)
  scoring_detail = video_analyzer.analyze(output_filepath, sketcher, start_time, video_fps)
  print("========== Score Result Completed Processing===========")
  return scoring_detail