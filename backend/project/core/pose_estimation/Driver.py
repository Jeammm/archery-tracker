from project.core.pose_estimation.VideoAnalyzer import VideoAnalyzer
from project.core.pose_estimation.Sketcher import Sketcher

def process_pose_video_data(input_filepath, output_filepath):
  # input
  video_name = input_filepath
  
  connections = [
    # Head connections
    (0, 1),  # Nose -> Left eye inner
    (0, 4),  # Nose -> Right eye inner
    (1, 2),  # Left eye inner -> Left eye
    (2, 3),  # Left eye -> Left eye outer
    (4, 5),  # Right eye inner -> Right eye
    (5, 6),  # Right eye -> Right eye outer
    (8, 6),  # Left ear -> Right eye outer
    (7, 8),  # Left ear -> Right ear
    
    # Torso connections
    (11, 12),  # Left shoulder -> Right shoulder
    (11, 23),  # Left shoulder -> Left hip
    (12, 24),  # Right shoulder -> Right hip
    (23, 24),  # Left hip -> Right hip
    
    # Left arm
    (11, 13),  # Left shoulder -> Left elbow
    (13, 15),  # Left elbow -> Left wrist
    (15, 19),  # Left wrist -> Left index
    (15, 21),  # Left wrist -> Left thumb
    
    # Right arm
    (12, 14),  # Right shoulder -> Right elbow
    (14, 16),  # Right elbow -> Right wrist
    (16, 20),  # Right wrist -> Right index
    (16, 22),  # Right wrist -> Right thumb
    
    # Left leg
    (23, 25),  # Left hip -> Left knee
    (25, 27),  # Left knee -> Left ankle
    (27, 29),  # Left ankle -> Left heel
    (29, 31),  # Left heel -> Left foot index
    
    # Right leg
    (24, 26),  # Right hip -> Right knee
    (26, 28),  # Right knee -> Right ankle
    (28, 30),  # Right ankle -> Right heel
    (30, 32)   # Right heel -> Right foot index
  ]

  joint_color = (0, 255, 0)
  bone_color = (255, 0, 0)
  thickness = 2

  # analyze
  sketcher = Sketcher(connections, joint_color, bone_color, thickness)
  video_analyzer = VideoAnalyzer(video_name)
  video_analyzer.analyze(output_filepath, sketcher)
  print("========== Pose Process Done ===========")