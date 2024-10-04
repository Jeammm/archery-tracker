from project.core.pose_estimation.PoseEstimator import PoseEstimator
from project.core.pose_estimation.Sketcher import Sketcher
import cv2

HOMOGRAPHY_LIFE_SPAN = 24

class VideoAnalyzer:
    def __init__(self, videoPath):
        self.cap = cv2.VideoCapture(videoPath)
        _, test_sample = self.cap.read()
        frameSize = test_sample.shape
        self.frame_h, self.frame_w, _ = frameSize
        self.pose_estimator = PoseEstimator()

    def _analyze_frame(self, frame):
        return self.pose_estimator.process_pose_frame(frame)

    def analyze(self, outputName, sketcher: Sketcher):

        # set output configurations
        frame_size = (self.frame_w, self.frame_h)
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(outputName, fourcc, 24.0, frame_size)

        while True:
            ret, frame = self.cap.read()

            if ret:
                skeleton_data, features, phase = self._analyze_frame(frame)
                
                sketcher.draw_skeleton(frame, skeleton_data)
            
                out.write(frame)
                
            else:
                print('Video stream is over.')
                break
                
        self.cap.release()
        out.release()
        return