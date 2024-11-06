import { useEffect, useRef, useState } from "react";
import { HitLocation } from "./AddMissingShotModal";
import { SetStateActionType } from "@/types/constant";

interface ShotLocationCanvasOverlayProps {
  hitLocation: HitLocation;
  setHitLocation: SetStateActionType<HitLocation>;
}

export const ShotLocationCanvasOverlay = (
  props: ShotLocationCanvasOverlayProps
) => {
  const { hitLocation, setHitLocation } = props;

  const hitCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [dragStart, setDragStart] = useState<HitLocation | null>(null);

  const handleDragStart = (clientX: number, clientY: number) => {
    // Store starting point of drag
    setDragStart({ x: clientX, y: clientY });
  };

  // Update location based on drag movement
  const handleDragMove = (clientX: number, clientY: number) => {
    const rect = hitCanvasRef.current?.getBoundingClientRect();

    if (!dragStart || !rect) {
      return;
    }

    // Calculate distance dragged
    const dx = (clientX - dragStart.x) * (1920 / rect.width);
    const dy = (clientY - dragStart.y) * (1080 / rect.height);

    // Update hit location based on drag distance, clamping to range
    setHitLocation((prevLocation) => ({
      x: Math.floor(Math.min(1920, Math.max(0, prevLocation.x + dx))),
      y: Math.floor(Math.min(1080, Math.max(0, prevLocation.y + dy))),
    }));

    // Update drag start position to current for continuous dragging
    setDragStart({ x: clientX, y: clientY });
  };

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = hitCanvasRef.current?.getBoundingClientRect();

    if (!rect) {
      return;
    }

    // Convert client coordinates to canvas coordinates
    const x = Math.floor(
      Math.min(1920, Math.max(0, (e.clientX - rect.left) * (1920 / rect.width)))
    );
    const y = Math.floor(
      Math.min(1080, Math.max(0, (e.clientY - rect.top) * (1080 / rect.height)))
    );

    // Update hit location to the clicked position
    setHitLocation({ x, y });
    handleDragStart(e.clientX, e.clientY);
  };
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) =>
    handleDragMove(e.clientX, e.clientY);
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
    const canvas = hitCanvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (context) {
      // Clear canvas before each draw
      context.clearRect(0, 0, canvas.width, canvas.height);

      // Calculate actual X and Y positions based on percentages
      const x = (hitLocation.x / 1920) * canvas.width;
      const y = (hitLocation.y / 1080) * canvas.height;

      // Draw the circle outline
      context.beginPath();
      context.arc(x, y, 4, 0, 2 * Math.PI);
      context.strokeStyle = "green"; // Set circle outline color
      context.lineWidth = 3; // Set outline thickness
      context.stroke(); // Draw only the outline
      context.closePath();
    }
  }, [hitLocation.x, hitLocation.y]);

  return (
    <canvas
      ref={hitCanvasRef}
      className="w-full h-full aspect-video absolute top-0"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp} // Stop drag if mouse leaves canvas
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    />
  );
};
