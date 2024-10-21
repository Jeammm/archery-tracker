export type Skeleton = Array<Point>;

export interface Point {
  x: number;
  y: number;
  z: number;
  invissibility: number;
}

export interface BodyFeatures {
  shoulder_distance: number;
  hip_distance: number;
  bow_shoulder_angle: number;
  drawing_shoulder_angle: number;
  bow_arm_elbow_angle: number;
  drawing_arm_elbow_angle: number;
  bow_wrist_angle: number;
  drawing_wrist_angle: number;
  spine_angle: number;
  hip_angle: number;
  left_knee_angle: number;
  right_knee_angle: number;
}

export const initailBodyFeatures: BodyFeatures = {
  shoulder_distance: 0,
  hip_distance: 0,
  bow_shoulder_angle: 0,
  drawing_shoulder_angle: 0,
  bow_arm_elbow_angle: 0,
  drawing_arm_elbow_angle: 0,
  bow_wrist_angle: 0,
  drawing_wrist_angle: 0,
  spine_angle: 0,
  hip_angle: 0,
  left_knee_angle: 0,
  right_knee_angle: 0,
};

export const initialSkeleton: Skeleton = [];
