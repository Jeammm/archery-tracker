import { cn } from "@/lib/utils";
import { SetStateActionType, XYRelation } from "@/types/constant";
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

const clientPostitionToCanvas = (e: React.MouseEvent<HTMLCanvasElement>) => {
  const rect = e.currentTarget.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const w = rect.width;
  const h = rect.height;

  return [x, y, w, h];
};

const getDiameter = (
  canvasX: number,
  canvasY: number,
  bullseyePoint: { x: number; y: number }
) => {
  const dx = canvasX - bullseyePoint.x;
  const dy = canvasY - bullseyePoint.y;

  return Math.floor((dx ** 2 + dy ** 2) ** 0.5);
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
    // Store starting point of drag
    setDragStart({ x: canvasX, y: canvasY });
  };

  // Update location based on drag movement
  const handleDragMove = (canvasX: number, canvasY: number) => {
    if (!dragStart) {
      return;
    }

    if (canvasMode === "bullseye" && setBullseyePoint) {
      // Calculate distance dragged
      const dx = canvasX - dragStart.x;
      const dy = canvasY - dragStart.y;

      setBullseyePoint((prevLocation) => ({
        x: Math.floor(
          Math.min(targetImageSize.x, Math.max(0, prevLocation.x + dx))
        ),
        y: Math.floor(
          Math.min(targetImageSize.y, Math.max(0, prevLocation.y + dy))
        ),
      }));

      // Update drag start position to current for continuous dragging
      setDragStart({ x: canvasX, y: canvasY });
    }

    if (canvasMode === "diameter" && setInnerDiameter) {
      const diameter = getDiameter(canvasX, canvasY, bullseyePoint);
      setInnerDiameter(diameter);
      setDragStart({ x: canvasX, y: canvasY });
    }
  };

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const [canvasX, canvasY] = clientPostitionToCanvas(e);

    if (canvasMode === "bullseye" && setBullseyePoint) {
      setBullseyePoint({ x: canvasX, y: canvasY });
      handleDragStart(canvasX, canvasY);
    }

    if (canvasMode === "diameter" && setInnerDiameter) {
      const diameter = getDiameter(canvasX, canvasY, bullseyePoint);
      setInnerDiameter(diameter);
      handleDragStart(canvasX, canvasY);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const [x, y] = clientPostitionToCanvas(e);
    handleDragMove(x, y);
  };

  const handleMouseUp = () => setDragStart(null);

  // Touch events
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

      // Draw the bullseye
      context.beginPath();
      context.strokeStyle = "lime";
      context.lineWidth = 3;
      context.moveTo(x - 6, y - 6);
      context.lineTo(x + 6, y + 6);
      context.moveTo(x - 6, y + 6);
      context.lineTo(x + 6, y - 6);

      context.stroke();
      context.closePath();

      // Draw the ring outline
      [...Array(ringsAmount)].map((_, index) => {
        context.beginPath();
        context.arc(
          x,
          y,
          innerDiameter + innerDiameter * index,
          0,
          2 * Math.PI
        );
        context.strokeStyle = "red";
        context.lineWidth = 2;
        context.stroke();
        context.closePath();
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
    if (!targetCanvasRef.current) {
      return;
    }
    targetCanvasRef.current.width =
      targetCanvasRef.current?.parentElement?.clientWidth || 500;
    targetCanvasRef.current.height =
      targetCanvasRef.current?.parentElement?.clientHeight || 500;
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
        // onMouseLeave={handleMouseUp} // Stop drag if mouse leaves canvas
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />
      {canvasMode && canvasMode !== "idle" && (
        <p className="absolute top-4 left-4 px-2 py-0.5 rounded-sm bg-primary text-primary-foreground">
          {canvasMode === "bullseye" && "Locate bullseye point"}
          {canvasMode === "diameter" && "Locate outline of the first ring"}
        </p>
      )}
    </>
  );
};
