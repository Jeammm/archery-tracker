import { Keypoint } from "@tensorflow-models/pose-detection";
import { useCallback, useEffect, useRef } from "react";

interface VideoOverlayCanvasProps {
  keypoints: Keypoint[];
  video: HTMLVideoElement | null;
  threshold: number;
}

export const VideoOverlayCanvas = (props: VideoOverlayCanvasProps) => {
  const { keypoints, video, threshold } = props;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const drawKeypoints = useCallback(
    (poses: Keypoint[]) => {
      const canvas = canvasRef.current;

      if (!canvas || !poses) {
        return;
      }

      const ctx = canvas.getContext("2d");

      if (ctx && video) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        poses.forEach((keypoint) => {
          if ((keypoint?.score || 0) > threshold) {
            const size = 50; // Square size

            // Draw square around keypoint
            ctx.beginPath();
            ctx.strokeStyle = "green";
            ctx.lineWidth = 4;
            ctx.strokeRect(
              keypoint.x - size / 2,
              keypoint.y - size / 2,
              size,
              size
            );

            const text = keypoint.name || "";
            ctx.font = "34px Arial"; // Set font size to 34px
            ctx.fillStyle = "red"; // Fill color red
            ctx.strokeStyle = "white"; // Stroke color white
            ctx.lineWidth = 4; // Width of the stroke

            // Draw the stroke first, then fill the text
            ctx.strokeText(
              text,
              keypoint.x - size / 2,
              keypoint.y - size / 2 - 5
            );
            ctx.fillText(
              text,
              keypoint.x - size / 2,
              keypoint.y - size / 2 - 5
            );
          }
        });
      }
    },
    [threshold, video]
  );

  useEffect(() => {
    drawKeypoints(keypoints);
  }, [drawKeypoints, keypoints]);

  return (
    <canvas ref={canvasRef} className="w-full h-full left-0 top-0 absolute" />
  );
};
