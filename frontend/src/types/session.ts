import { BodyFeatures, Skeleton } from "./skeleton";
import { MediaVideo } from "./video";

export interface Session {
  created_at: string;
  start_process_at?: string;
  user_id: string;
  _id: string;
  model: string;
  round_result: Round[];
  session_status: string;
  processing_status?: string;
  total_score?: number;
  maximum_score?: number;
  accuracy?: number;
  features?: BodyFeatures;
  total_session_time: number;
}

export interface Hit {
  frame: number;
  hit_time?: string;
  id: number;
  point: number[];
  score: number;
  bullseye_relation?: number[];
  target_image_url?: string;
  target_clean_image_url?: string;
  pose_image_url?: string;
  pose_clean_image_url?: string;
  skeleton_data?: Skeleton;
  features?: BodyFeatures;
  phase?: string;
}

export interface Round {
  _id: string;
  created_at: string;
  session_id: string;
  pose_status: string;
  pose_task_id?: string;
  capture_task_id?: string;
  pose_video?: MediaVideo[];
  pose_video_raw?: MediaVideo[];
  score?: Hit[];
  target_status: string;
  capture_status: string;
  target_task_id?: string;
  target_video?: MediaVideo[];
  target_video_raw?: MediaVideo[];
  target_error_message?: string;
  pose_error_message?: string;
  capture_error_message?: string;
  total_score?: number;
  maximum_score?: number;
  accuracy?: number;
}

export interface StatsValue {
  compare: number;
  last_week: number;
  current_week: number;
}
export interface Stats {
  total_training_time_compare: StatsValue;
  total_round_count_campare: StatsValue;
  total_accuracy_compare: StatsValue;
}
