import * as LANDMARK from "../types/constant";
import { Point, Skeleton } from "../types/skeleton";
import DEFAULT_IMAGE from "/placeholder-image.jpg";

export const getArcFromPosition = (
  canvas: CanvasRenderingContext2D,
  point: Point
) => {
  const { x, y } = point;

  return {
    x: x * canvas.canvas.width,
    y: y * canvas.canvas.height,
    radius: 3,
    startAngle: 0,
    endAngle: 2 * Math.PI,
  };
};

export const drawStickFigure = (
  canvas: HTMLCanvasElement,
  skeletonData: Skeleton
) => {
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return;
  }

  // Define the joints to connect for stick figure
  const connections = [
    [LANDMARK.LEFT_SHOULDER, LANDMARK.RIGHT_SHOULDER],
    [LANDMARK.LEFT_SHOULDER, LANDMARK.LEFT_ELBOW],
    [LANDMARK.LEFT_ELBOW, LANDMARK.LEFT_WRIST],
    [LANDMARK.RIGHT_SHOULDER, LANDMARK.RIGHT_ELBOW],
    [LANDMARK.RIGHT_ELBOW, LANDMARK.RIGHT_WRIST],
    [LANDMARK.LEFT_SHOULDER, LANDMARK.LEFT_HIP],
    [LANDMARK.RIGHT_SHOULDER, LANDMARK.RIGHT_HIP],
    [LANDMARK.LEFT_HIP, LANDMARK.RIGHT_HIP],
    [LANDMARK.LEFT_HIP, LANDMARK.LEFT_KNEE],
    [LANDMARK.LEFT_KNEE, LANDMARK.LEFT_ANKLE],
    [LANDMARK.RIGHT_HIP, LANDMARK.RIGHT_KNEE],
    [LANDMARK.RIGHT_KNEE, LANDMARK.RIGHT_ANKLE],
    [LANDMARK.LEFT_ANKLE, LANDMARK.LEFT_HEEL],
    [LANDMARK.LEFT_HEEL, LANDMARK.LEFT_FOOT_INDEX],
    [LANDMARK.RIGHT_ANKLE, LANDMARK.RIGHT_HEEL],
    [LANDMARK.RIGHT_HEEL, LANDMARK.RIGHT_FOOT_INDEX],
    [LANDMARK.LEFT_WRIST, LANDMARK.LEFT_PINKY],
    [LANDMARK.LEFT_WRIST, LANDMARK.LEFT_INDEX],
    [LANDMARK.LEFT_WRIST, LANDMARK.LEFT_THUMB],
    [LANDMARK.RIGHT_WRIST, LANDMARK.RIGHT_PINKY],
    [LANDMARK.RIGHT_WRIST, LANDMARK.RIGHT_INDEX],
    [LANDMARK.RIGHT_WRIST, LANDMARK.RIGHT_THUMB],
  ];

  // Draw each connection
  ctx.clearRect(0, 0, 500, 500);
  ctx.fillStyle = "blue";
  ctx.lineWidth = 3;

  for (const id in skeletonData) {
    if (!LANDMARK.INTEREST_POINT.includes(Number(id))) {
      continue;
    }
    const circle = getArcFromPosition(ctx, skeletonData[id]);
    ctx.beginPath();
    ctx.arc(
      circle.x,
      circle.y,
      circle.radius,
      circle.startAngle,
      circle.endAngle
    );
    ctx.fillStyle = "red";
    ctx.fill();
    ctx.closePath();
  }

  connections.map(([joint1, joint2]) => {
    const coord1 = skeletonData[joint1];
    const coord2 = skeletonData[joint2];

    if (!coord1 || !coord2) {
      return;
    }

    const pos1 = getArcFromPosition(ctx, coord1);
    const pos2 = getArcFromPosition(ctx, coord2);

    if (coord1 && coord2) {
      ctx.beginPath();
      ctx.moveTo(pos1.x, pos1.y);
      ctx.lineTo(pos2.x, pos2.y);
      ctx.stroke();
      ctx.closePath();
    }
  });
};

export const onImageError = ({
  currentTarget,
}: {
  currentTarget: EventTarget & HTMLImageElement;
}) => {
  currentTarget.onerror = null;
  currentTarget.src = DEFAULT_IMAGE;
};
