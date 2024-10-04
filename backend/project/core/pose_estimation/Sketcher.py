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