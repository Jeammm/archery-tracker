from project.core.pose_estimation.PoseEstimator import PoseEstimator
from project.core.pose_estimation.Sketcher import Sketcher
import cv2


NOT_DRAWING_FRAME_THRESHOLD = 10
DRAWING_FRAME_THRESHOLD = 15

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
        out = cv2.VideoWriter(outputName, fourcc, 30, frame_size)

        first_drawing_frame = 0
        drawing_frames_count = 0
        not_drawing_frames_count = 0


        aiming_frames = []

        current_frame = 0
        while True:
            ret, frame = self.cap.read()
            current_frame += 1

            if ret:
                skeleton_data, features, phase = self._analyze_frame(frame)

                phase_info = {
                    "first_drawing_frame":first_drawing_frame,
                    "drawing_frames_count":drawing_frames_count,
                    "not_drawing_frames_count":not_drawing_frames_count,
                    'phase': phase
                }
                sketcher.draw_skeleton(frame, skeleton_data)
                sketcher.type_pose_phase(frame, phase_info)
                sketcher.type_skeleton_feature(frame, features)
                sketcher.type_frame(frame, current_frame)

                if phase == "Drawing" and drawing_frames_count == DRAWING_FRAME_THRESHOLD:
                    # drawing phase confirmed
                    aiming_frames.append(first_drawing_frame)
                    drawing_frames_count += 1

                elif phase == "Drawing" and drawing_frames_count == 0:
                    # drawing start
                    first_drawing_frame = current_frame
                    drawing_frames_count += 1
                    not_drawing_frames_count = 0

                elif phase == "Drawing":
                    # drawing phase counting
                    drawing_frames_count += 1

                elif not_drawing_frames_count < NOT_DRAWING_FRAME_THRESHOLD:
                    # not drawing phase counting
                    not_drawing_frames_count += 1

                else:
                    # not drawing confirmed
                    first_drawing_frame = 0
                    drawing_frames_count = 0

                out.write(frame)

            else:
                break

        self.cap.release()
        out.release()
        return aiming_frames