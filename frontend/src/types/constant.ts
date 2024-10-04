export const NOSE = 0;
export const LEFT_EYE_INNER = 1;
export const LEFT_EYE = 2;
export const LEFT_EYE_OUTER = 3;
export const RIGHT_EYE_INNER = 4;
export const RIGHT_EYE = 5;
export const RIGHT_EYE_OUTER = 6;
export const LEFT_EAR = 7;
export const RIGHT_EAR = 8;
export const MOUTH_LEFT = 9;
export const MOUTH_RIGHT = 10;
export const LEFT_SHOULDER = 11;
export const RIGHT_SHOULDER = 12;
export const LEFT_ELBOW = 13;
export const RIGHT_ELBOW = 14;
export const LEFT_WRIST = 15;
export const RIGHT_WRIST = 16;
export const LEFT_PINKY = 17;
export const RIGHT_PINKY = 18;
export const LEFT_INDEX = 19;
export const RIGHT_INDEX = 20;
export const LEFT_THUMB = 21;
export const RIGHT_THUMB = 22;
export const LEFT_HIP = 23;
export const RIGHT_HIP = 24;
export const LEFT_KNEE = 25;
export const RIGHT_KNEE = 26;
export const LEFT_ANKLE = 27;
export const RIGHT_ANKLE = 28;
export const LEFT_HEEL = 29;
export const RIGHT_HEEL = 30;
export const LEFT_FOOT_INDEX = 31;
export const RIGHT_FOOT_INDEX = 32;

export const INTEREST_POINT = [
  LEFT_EYE,
  RIGHT_EYE,
  NOSE,
  LEFT_SHOULDER,
  LEFT_ELBOW,
  LEFT_WRIST,
  LEFT_INDEX,
  LEFT_PINKY,
  LEFT_THUMB,
  LEFT_HIP,
  LEFT_KNEE,
  LEFT_ANKLE,
  LEFT_HEEL,
  LEFT_FOOT_INDEX,
  RIGHT_SHOULDER,
  RIGHT_ELBOW,
  RIGHT_WRIST,
  RIGHT_INDEX,
  RIGHT_PINKY,
  RIGHT_THUMB,
  RIGHT_HIP,
  RIGHT_KNEE,
  RIGHT_ANKLE,
  RIGHT_HEEL,
  RIGHT_FOOT_INDEX,
];

export interface TargetModel {
  measure_unit: number;
  bullseye_point: [number, number];
  inner_diameter_px: number;
  rings_amount: number;
  model: string;
  frame_size: [number, number, number];
}

export const modelChoices: TargetModel[] = [
  {
    measure_unit: 0.0762,
    bullseye_point: [325, 309],
    inner_diameter_px: 50,
    rings_amount: 6,
    model: "Olympic Standard Target",
    frame_size: [1080, 1920, 3],
  },
];
