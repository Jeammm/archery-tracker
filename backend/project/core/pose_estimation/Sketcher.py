import cv2

class Sketcher:
    def __init__(self, connections=None, joint_color=(0, 255, 0), bone_color=(255, 0, 0), thickness=2):
        self.connections = connections
        self.joint_color = joint_color
        self.bone_color = bone_color
        self.thickness = thickness

    def draw_skeleton(self, img, skeleton_data):
        """
        Draws skeleton joints and connections (bones) on the original image (modifies the input image in place).

        Parameters:
        - img: OpenCV image (numpy array) where the skeleton will be drawn.
        - skeleton_data: Dictionary of joint ID to (x, y, z, visibility) coordinates.
        """
        # Draw joints
        for joint_id, joint_data in skeleton_data.items():
            x, y = joint_data['x'], joint_data['y']
            cv2.circle(img, (int(x * img.shape[1]), int(y * img.shape[0])), 5, self.joint_color, -1)  # Scaled to image size

        # Draw bones (connections) if provided
        if self.connections:
            for (i, j) in self.connections:
                if i in skeleton_data and j in skeleton_data:
                    pt1 = (int(skeleton_data[i]['x'] * img.shape[1]), int(skeleton_data[i]['y'] * img.shape[0]))
                    pt2 = (int(skeleton_data[j]['x'] * img.shape[1]), int(skeleton_data[j]['y'] * img.shape[0]))
                    cv2.line(img, pt1, pt2, self.bone_color, self.thickness)  # Line representing bone
                    
    def type_pose_phase(self, img, phase_info, dataColor = (0x0,0x0,0xff)):
        """
        Draws the phase information on the image.

        Args:
            img (numpy.ndarray): The image on which to draw the phase information.
            phase_info (dict): Dictionary containing phase data with keys:
            - "first_drawing_frame": The first frame of drawing.
            - "drawing_frames_count": The count of drawing frames.
            - "not_drawing_frames_count": The count of non-drawing frames.
            - "phase": The current phase.
            dataColor (tuple, optional): The color of the phase text. Defaults to (0, 0, 255).
        """
        img_h, img_w, _ = img.shape
        cv2.putText(img, 'Phase: ', (int(img_w * .52), int(img_h * .905)),
                    cv2.FONT_HERSHEY_SIMPLEX, 1.4, (0x0,0x0,0x0), 4)
        
        cv2.putText(img, phase_info["phase"], (int(img_w * .675), int(img_h * .905)),
                    cv2.FONT_HERSHEY_SIMPLEX, 1.4, dataColor, 4)
    

    def type_skeleton_feature(self, img, features, dataColor = (0x0,0x0,0xff)):
        img_h, img_w, _ = img.shape
        
        font_size = 0.8
        font_weight = 2
        
        features_list = [
            "bow_shoulder_angle",
            "drawing_shoulder_angle",
            "bow_arm_elbow_angle",
            "drawing_arm_elbow_angle",    
        ]
                
        for i in range(len(features_list)):
            feature = features_list[i]
            cv2.putText(img, feature + ': ', (int(img_w * .6), int(img_h * (.1 + (.05 * i)))),
                        cv2.FONT_HERSHEY_SIMPLEX, font_size, (0x0,0x0,0x0), font_weight)
            
            value = features[feature] if feature in features else 0
            cv2.putText(img, "{:.1f}".format(value), (int(img_w * .9), int(img_h * (.1 + (.05 * i)))),
                        cv2.FONT_HERSHEY_SIMPLEX, font_size, dataColor, font_weight)
    
    def type_frame(self, img, frame, dataColor = (0x0,0x0,0xff)):
        img_h, img_w, _ = img.shape
        
        font_size = 0.8
        font_weight = 2
            
        cv2.putText(img, str(frame), (int(img_w * .9), int(img_h * 0.8)),
                    cv2.FONT_HERSHEY_SIMPLEX, font_size, dataColor, font_weight)
        