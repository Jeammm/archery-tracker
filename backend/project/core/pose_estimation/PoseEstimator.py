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
        left_hand = np.array([landmarks[self.mp_pose.PoseLandmark.LEFT_THUMB.value].x,
                            landmarks[self.mp_pose.PoseLandmark.LEFT_THUMB.value].y])
        right_hand = np.array([landmarks[self.mp_pose.PoseLandmark.RIGHT_THUMB.value].x,
                            landmarks[self.mp_pose.PoseLandmark.RIGHT_THUMB.value].y])
        
        # Calculate distances (optional but helpful for feature set)
        shoulder_distance = np.linalg.norm(left_shoulder - right_shoulder)
        hip_distance = np.linalg.norm(left_hip - right_hip)

        # Calculate angles
        # Bow shoulder (assume left shoulder as bow shoulder)
        bow_shoulder_angle = calculate_angle(left_hip, left_shoulder, left_elbow)
        
        # Drawing shoulder (assume right shoulder as drawing shoulder)
        drawing_shoulder_angle = calculate_angle(right_hip, right_shoulder, right_elbow)
        
        # Elbow angles
        bow_arm_elbow_angle = calculate_angle(left_shoulder, left_elbow, left_wrist)
        drawing_arm_elbow_angle = calculate_angle(right_shoulder, right_elbow, right_wrist)
        
        # Wrist angles
        bow_wrist_angle = calculate_angle(left_elbow, left_wrist, left_hand)
        drawing_wrist_angle = calculate_angle(right_elbow, right_wrist, right_hand)
        
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
        
        # Classify the phases based on feature thresholds
        # Drawing Phase
        if 70 < bow_shoulder_angle < 100 and 100 < drawing_shoulder_angle < 140 and 160 < bow_arm_elbow_angle < 185 and 13 < drawing_arm_elbow_angle < 40:
            return "Drawing"
        
        # Default or unclassified phase
        else:
            return "Other"
    
    def convert_keys_to_strings(self, data):
        return {str(key): {k: float(v) if isinstance(v, (np.float32, np.float64)) else v for k, v in value.items()} for key, value in data.items()}


def calculate_angle(point1, point2, point3):
    """
    Calculate the angle formed by three points: point1 -> point2 -> point3.
    
    Args:
        point1 (array-like): First point (e.g., [x1, y1]).
        point2 (array-like): Vertex point where the angle is formed (e.g., [x2, y2]).
        point3 (array-like): Third point (e.g., [x3, y3]).
        
    Returns:
        float: Angle in degrees.
    """
    # Vectors
    vector1 = np.array(point1) - np.array(point2)
    vector2 = np.array(point3) - np.array(point2)

    # Calculate the angle
    dot_product = np.dot(vector1, vector2)
    magnitude1 = np.linalg.norm(vector1)
    magnitude2 = np.linalg.norm(vector2)

    # Avoid division by zero
    if magnitude1 == 0 or magnitude2 == 0:
        return 0.0

    # Angle in radians and convert to degrees
    angle_radians = np.arccos(np.clip(dot_product / (magnitude1 * magnitude2), -1.0, 1.0))
    angle_degrees = np.degrees(angle_radians)

    return angle_degrees