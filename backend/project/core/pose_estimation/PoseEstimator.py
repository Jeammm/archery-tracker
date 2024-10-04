import cv2
import mediapipe as mp
import numpy as np
import base64

class PoseEstimator:
  def __init__(self):
    self.mp_pose = mp.solutions.pose
    self.pose = self.mp_pose.Pose(
        # static_image_mode=False, 
        # model_complexity=2,
        # min_detection_confidence=0.7,
        # min_tracking_confidence=0.7,
        # smooth_landmarks=True
    )
    self.frame_count = 0

  def process_pose_frame(self, frame):
      img_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
      results = self.pose.process(img_rgb)
      self.frame_count += 1
      if (self.frame_count >= 12):
          self.frame_count = 0
          print("processing pose...")

      if results.pose_landmarks:
          skeleton_data = {
              id: {'x': lm.x, 'y': lm.y, 'z': lm.z, 'visibility': lm.visibility}
              for id, lm in enumerate(results.pose_landmarks.landmark)
          }
          features = self.extract_features(results.pose_landmarks.landmark)
          phase = self.classify_phase(features)
          return skeleton_data, features, phase
      else:
          return {}, {}, "No Pose Detected"

  def extract_features(self, landmarks):
      features = {}
      left_shoulder = np.array([landmarks[self.mp_pose.PoseLandmark.LEFT_SHOULDER.value].x,
                                landmarks[self.mp_pose.PoseLandmark.LEFT_SHOULDER.value].y])
      right_shoulder = np.array([landmarks[self.mp_pose.PoseLandmark.RIGHT_SHOULDER.value].x,
                                landmarks[self.mp_pose.PoseLandmark.RIGHT_SHOULDER.value].y])
      left_elbow = np.array([landmarks[self.mp_pose.PoseLandmark.LEFT_ELBOW.value].x,
                            landmarks[self.mp_pose.PoseLandmark.LEFT_ELBOW.value].y])
      left_wrist = np.array([landmarks[self.mp_pose.PoseLandmark.LEFT_WRIST.value].x,
                            landmarks[self.mp_pose.PoseLandmark.LEFT_WRIST.value].y])

      shoulder_distance = np.linalg.norm(left_shoulder - right_shoulder)
      elbow_distance = np.linalg.norm(left_elbow - left_wrist)

      shoulder_elbow_angle = np.degrees(np.arctan2(left_elbow[1] - left_shoulder[1], left_elbow[0] - left_shoulder[0]))
      elbow_wrist_angle = np.degrees(np.arctan2(left_wrist[1] - left_elbow[1], left_wrist[0] - left_elbow[0]))

      features["shoulder_distance"] = shoulder_distance 
      features["elbow_distance"] = elbow_distance
      features["shoulder_elbow_angle"] = shoulder_elbow_angle
      features["elbow_wrist_angle"] = elbow_wrist_angle
      return features
    
  def classify_phase(self, features):
      if features["shoulder_elbow_angle"] > 80 and features["shoulder_elbow_angle"] < 100:
          return "Drawing"
      elif features["elbow_wrist_angle"] > 150:
          return "Aiming"
      else:
          return "Other"