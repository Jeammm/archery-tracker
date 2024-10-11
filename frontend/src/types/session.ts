import { MediaVideo } from "./video";

export interface Session {
  created_at: string;
  start_process_at?: string;
  pose_status: string;
  pose_task_id?: string;
  pose_video?: MediaVideo[];
  pose_video_raw?: MediaVideo[];
  score?: Hit[];
  target_status: string;
  target_task_id?: string;
  target_video?: MediaVideo[];
  target_video_raw?: MediaVideo[];
  user_id: string;
  _id: string;
  target_error_message?: string;
  pose_error_message?: string;
  model: string;
}

export interface Hit {
  frame: number;
  hit_time: string;
  id: string;
  point: number[];
  score: number;
  bullseye_relation: number[];
  target_image_url?: string;
  target_clean_image_url?: string;
  pose_image_url?: string;
  pose_clean_image_url?: string;
}
