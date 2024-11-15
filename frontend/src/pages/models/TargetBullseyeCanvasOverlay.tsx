import { cn } from "@/lib/utils";
import { SetStateActionType, XYRelation } from "@/types/constant";
import { Crosshair, LocateFixed } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export type CanvasMode = "idle" | "bullseye" | "diameter";

interface TargetBullseyeCanvasOverlayProps {
  bullseyePoint: XYRelation;
  setBullseyePoint?: SetStateActionType<XYRelation>;
  innerDiameter: number;
  setInnerDiameter?: SetStateActionType<number>;
  ringsAmount: number;
  canvasMode?: CanvasMode;
  setCanvasMode?: SetStateActionType<CanvasMode>;
  targetImageSize: XYRelation;
  canvasSignal: number;
}

// Convert mouse event to canvas position
const windowToCanvasPosition = (e: React.MouseEvent<HTMLCanvasElement>) => {
  const rect = e.currentTarget.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const w = rect.width;
  const h = rect.height;

  return [x, y, w, h];
};

// Calculate ring diameter base on 2 location
const getDiameter = (
  imageX: number,
  imageY: number,
  bullseyePoint: { x: number; y: number }
) => {
  const dx = imageX - bullseyePoint.x;
  const dy = imageY - bullseyePoint.y;

  return Math.floor((dx ** 2 + dy ** 2) ** 0.5);
};

// Convert canvas location to real position realtive to image size
const canvasToImageLocation = (
  canvasX: number,
  canvasY: number,
  imageSizeX: number,
  imageSizeY: number,
  canvasSizeX: number,
  canvasSizeY: number
) => {
  const imageX = Math.floor((canvasX * imageSizeX) / canvasSizeX);
  const imageY = Math.floor((canvasY * imageSizeY) / canvasSizeY);

  return [imageX, imageY];
};

// Convert real location on image to canvas position
const imageToCanvasLocation = (
  imageX: number,
  imageY: number,
  imageSizeX: number,
  imageSizeY: number,
  canvasSizeX: number,
  canvasSizeY: number
) => {
  const canvasX = Math.floor((imageX * canvasSizeX) / imageSizeX);
  const canvasY = Math.floor((imageY * canvasSizeY) / imageSizeY);

  return [canvasX, canvasY];
};

export const TargetBullseyeCanvasOverlay = (
  props: TargetBullseyeCanvasOverlayProps
) => {
  const {
    bullseyePoint,
    setBullseyePoint,
    innerDiameter,
    setInnerDiameter,
    ringsAmount,
    canvasMode,
    targetImageSize,
    canvasSignal,
  } = props;

  const targetCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [imageResizeSignal, setImageResizeSignal] = useState<number>(0);

  const [dragStart, setDragStart] = useState<XYRelation | null>(null);

  const handleDragStart = (canvasX: number, canvasY: number) => {
    setDragStart({ x: canvasX, y: canvasY });
  };

  const handleDragMove = (canvasX: number, canvasY: number) => {
    if (!dragStart || !targetCanvasRef.current) {
      return;
    }

    const [imageX, imageY] = canvasToImageLocation(
      canvasX,
      canvasY,
      targetImageSize.x,
      targetImageSize.y,
      targetCanvasRef.current.width,
      targetCanvasRef.current.height
    );

    if (canvasMode === "bullseye" && setBullseyePoint) {
      setBullseyePoint({ x: imageX, y: imageY });
      setDragStart({ x: canvasX, y: canvasY });
    }

    if (canvasMode === "diameter" && setInnerDiameter) {
      const diameter = getDiameter(imageX, imageY, bullseyePoint);
      setInnerDiameter(diameter);
      setDragStart({ x: canvasX, y: canvasY });
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!targetCanvasRef.current) {
      return;
    }

    const [canvasX, canvasY] = windowToCanvasPosition(e);
    const [imageX, imageY] = canvasToImageLocation(
      canvasX,
      canvasY,
      targetImageSize.x,
      targetImageSize.y,
      targetCanvasRef.current.width,
      targetCanvasRef.current.height
    );

    if (canvasMode === "bullseye" && setBullseyePoint) {
      setBullseyePoint({ x: imageX, y: imageY });
      handleDragStart(canvasX, canvasY);
    }

    if (canvasMode === "diameter" && setInnerDiameter) {
      const diameter = getDiameter(imageX, imageY, bullseyePoint);
      setInnerDiameter(diameter);
      handleDragStart(canvasX, canvasY);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const [x, y] = windowToCanvasPosition(e);
    handleDragMove(x, y);
  };

  const handleMouseUp = () => setDragStart(null);

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const touch = e.touches[0];
    handleDragStart(touch.clientX, touch.clientY);
  };
  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const touch = e.touches[0];
    handleDragMove(touch.clientX, touch.clientY);
  };
  const handleTouchEnd = () => setDragStart(null);

  useEffect(() => {
    const canvas = targetCanvasRef.current;

    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (context) {
      context.clearRect(0, 0, canvas.width, canvas.height);

      const { x, y } = bullseyePoint;

      // convert image location to canvas location before render
      const [canvasX, canvasY] = imageToCanvasLocation(
        x,
        y,
        targetImageSize.x,
        targetImageSize.y,
        canvas.width,
        canvas.height
      );

      // Draw the bullseye
      context.beginPath();
      context.strokeStyle = "lime";
      context.lineWidth = 3;
      context.moveTo(canvasX - 6, canvasY - 6);
      context.lineTo(canvasX + 6, canvasY + 6);
      context.moveTo(canvasX - 6, canvasY + 6);
      context.lineTo(canvasX + 6, canvasY - 6);

      context.stroke();
      context.closePath();

      // Draw the rings outline
      [...Array(ringsAmount)].map((_, index) => {
        const radius =
          ((innerDiameter + innerDiameter * index) * canvas.width) /
          targetImageSize.x;

        context.beginPath();
        context.arc(canvasX, canvasY, radius, 0, 2 * Math.PI);
        context.strokeStyle = "red";
        context.lineWidth = 2;
        context.stroke();
        context.closePath();

        let previousRadius = 0;
        if (index > 0) {
          previousRadius =
            ((innerDiameter + innerDiameter * (index - 1)) * canvas.width) /
            targetImageSize.x;
        }
        const interRing = (radius - previousRadius) / 2;

        const score = String(10 - index);
        const textX = canvasX + previousRadius + interRing - 5;
        const textY = canvasY + 5;

        context.font = "bold 16px Arial";
        context.fillStyle = "lime";
        context.fillText(score, textX, textY);
      });
    }
  }, [
    innerDiameter,
    targetImageSize,
    ringsAmount,
    bullseyePoint,
    canvasSignal,
    imageResizeSignal,
  ]);

  useEffect(() => {
    if (!targetCanvasRef.current || !targetCanvasRef.current.parentElement) {
      return;
    }
    targetCanvasRef.current.width =
      targetCanvasRef.current.parentElement.clientWidth || 500;
    targetCanvasRef.current.height =
      targetCanvasRef.current.parentElement.clientHeight || 500;
    setImageResizeSignal((prev) => prev + 1);
  }, [targetImageSize]);

  return (
    <>
      <canvas
        ref={targetCanvasRef}
        className={cn(["absolute top-0 object-fill"])}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />
      {canvasMode && canvasMode !== "idle" && (
        <div className="absolute top-4 left-4 px-2 py-0.5 rounded-sm bg-primary text-primary-foreground flex gap-1.5 items-center">
          {canvasMode === "bullseye" && (
            <>
              <LocateFixed size={18} />
              <p>Locate bullseye point</p>
            </>
          )}
          {canvasMode === "diameter" && (
            <>
              <Crosshair size={18} />
              <p>Locate outline of the first ring</p>
            </>
          )}
        </div>
      )}
    </>
  );
};
