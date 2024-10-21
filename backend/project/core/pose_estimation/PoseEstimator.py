import cv2
import mediapipe as mp
import numpy as np

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
        
        # Extract joint positions
        left_shoulder = np.array([landmarks[self.mp_pose.PoseLandmark.LEFT_SHOULDER.value].x,
                                landmarks[self.mp_pose.PoseLandmark.LEFT_SHOULDER.value].y])
        right_shoulder = np.array([landmarks[self.mp_pose.PoseLandmark.RIGHT_SHOULDER.value].x,
                                landmarks[self.mp_pose.PoseLandmark.RIGHT_SHOULDER.value].y])
        left_elbow = np.array([landmarks[self.mp_pose.PoseLandmark.LEFT_ELBOW.value].x,
                            landmarks[self.mp_pose.PoseLandmark.LEFT_ELBOW.value].y])
        right_elbow = np.array([landmarks[self.mp_pose.PoseLandmark.RIGHT_ELBOW.value].x,
                                landmarks[self.mp_pose.PoseLandmark.RIGHT_ELBOW.value].y])
        left_wrist = np.array([landmarks[self.mp_pose.PoseLandmark.LEFT_WRIST.value].x,
                            landmarks[self.mp_pose.PoseLandmark.LEFT_WRIST.value].y])
        right_wrist = np.array([landmarks[self.mp_pose.PoseLandmark.RIGHT_WRIST.value].x,
                                landmarks[self.mp_pose.PoseLandmark.RIGHT_WRIST.value].y])
        left_hip = np.array([landmarks[self.mp_pose.PoseLandmark.LEFT_HIP.value].x,
                            landmarks[self.mp_pose.PoseLandmark.LEFT_HIP.value].y])
        right_hip = np.array([landmarks[self.mp_pose.PoseLandmark.RIGHT_HIP.value].x,
                            landmarks[self.mp_pose.PoseLandmark.RIGHT_HIP.value].y])
        left_knee = np.array([landmarks[self.mp_pose.PoseLandmark.LEFT_KNEE.value].x,
                            landmarks[self.mp_pose.PoseLandmark.LEFT_KNEE.value].y])
        right_knee = np.array([landmarks[self.mp_pose.PoseLandmark.RIGHT_KNEE.value].x,
                            landmarks[self.mp_pose.PoseLandmark.RIGHT_KNEE.value].y])
        
        # Calculate distances (optional but helpful for feature set)
        shoulder_distance = np.linalg.norm(left_shoulder - right_shoulder)
        hip_distance = np.linalg.norm(left_hip - right_hip)

        # Calculate angles
        # Bow shoulder (assume left shoulder as bow shoulder)
        torso_vector = left_shoulder - left_hip
        bow_shoulder_angle = np.degrees(np.arctan2(torso_vector[1], torso_vector[0]))
        
        # Drawing shoulder (assume right shoulder as drawing shoulder)
        drawing_shoulder_angle = np.degrees(np.arctan2(right_elbow[1] - right_shoulder[1],
                                                    right_elbow[0] - right_shoulder[0]))
        
        # Elbow angles
        bow_arm_elbow_angle = np.degrees(np.arctan2(left_wrist[1] - left_elbow[1],
                                                    left_wrist[0] - left_elbow[0]))
        drawing_arm_elbow_angle = np.degrees(np.arctan2(right_wrist[1] - right_elbow[1],
                                                        right_wrist[0] - right_elbow[0]))
        
        # Wrist angles
        bow_wrist_angle = np.degrees(np.arctan2(left_wrist[1] - left_elbow[1],
                                                left_wrist[0] - left_elbow[0]))
        drawing_wrist_angle = np.degrees(np.arctan2(right_wrist[1] - right_elbow[1],
                                                    right_wrist[0] - right_elbow[0]))
        
        # Spine alignment
        spine_angle = np.degrees(np.arctan2(left_shoulder[1] - left_hip[1],
                                            left_shoulder[0] - left_hip[0]))
        
        # Hip and knee angles
        hip_angle = np.degrees(np.arctan2(left_hip[1] - right_hip[1],
                                        left_hip[0] - right_hip[0]))
        left_knee_angle = np.degrees(np.arctan2(left_knee[1] - left_hip[1],
                                                left_knee[0] - left_hip[0]))
        right_knee_angle = np.degrees(np.arctan2(right_knee[1] - right_hip[1],
                                                right_knee[0] - right_hip[0]))

        # Add features to dictionary
        features["shoulder_distance"] = shoulder_distance
        features["hip_distance"] = hip_distance
        features["bow_shoulder_angle"] = bow_shoulder_angle
        features["drawing_shoulder_angle"] = drawing_shoulder_angle
        features["bow_arm_elbow_angle"] = bow_arm_elbow_angle
        features["drawing_arm_elbow_angle"] = drawing_arm_elbow_angle
        features["bow_wrist_angle"] = bow_wrist_angle
        features["drawing_wrist_angle"] = drawing_wrist_angle
        features["spine_angle"] = spine_angle
        features["hip_angle"] = hip_angle
        features["left_knee_angle"] = left_knee_angle
        features["right_knee_angle"] = right_knee_angle

        return features
        
    def classify_phase(self, features):
        bow_shoulder_angle = features.get("bow_shoulder_angle")
        drawing_shoulder_angle = features.get("drawing_shoulder_angle")
        bow_arm_elbow_angle = features.get("bow_arm_elbow_angle")
        drawing_arm_elbow_angle = features.get("drawing_arm_elbow_angle")
        bow_wrist_angle = features.get("bow_wrist_angle")
        drawing_wrist_angle = features.get("drawing_wrist_angle")
        spine_angle = features.get("spine_angle")
        
        # Classify the phases based on feature thresholds
        # Drawing Phase
        if 80 < bow_shoulder_angle < 100 and 60 < drawing_arm_elbow_angle < 120:
            return "Drawing"
        
        # Aiming Phase
        elif 150 < drawing_arm_elbow_angle < 180 and 140 < bow_arm_elbow_angle < 180:
            return "Aiming"
        
        # Release Phase
        elif drawing_wrist_angle > 160 and bow_wrist_angle > 160 and abs(spine_angle) < 10:
            return "Release"
        
        # Default or unclassified phase
        else:
            return "Other"
    
    def convert_keys_to_strings(self, data):
        return {str(key): {k: float(v) if isinstance(v, (np.float32, np.float64)) else v for k, v in value.items()} for key, value in data.items()}
        