export type Skeleton = Array<Point>;

export interface Point {
  x: number;
  y: number;
  z: number;
  invissibility: number;
}

export interface BodyFeatures {
  shoulder_distance: number;
  elbow_distance: number;
  shoulder_elbow_angle: number;
  elbow_wrist_angle: number;
}

export const initailBodyFeatures: BodyFeatures = {
  shoulder_distance: 0,
  elbow_distance: 0,
  shoulder_elbow_angle: 0,
  elbow_wrist_angle: 0,
};

export const initialSkeleton: Skeleton = [];
