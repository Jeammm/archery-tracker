import { cn } from "@/lib/utils";
import { Hit } from "@/types/session";
import { onImageError } from "@/utils/canvasHelper";
import { MousePointer2, Move3d, Target } from "lucide-react";
import React from "react";
import { useState } from "react";

interface TargetImageWithShotOverlay {
  targetImage: string;
  hits: Hit[];
}

export const TargetImageWithShotOverlay = (
  props: TargetImageWithShotOverlay
) => {
  const { targetImage, hits } = props;

  const [activeHitIndex, setActiveHitIndex] = useState<number | null>(null);

  const getPositionInPercent = (point: number[]) => {
    const x = (point[0] / 1920) * 100;
    const y = (point[1] / 1080) * 100;

    return [x, y];
  };

  return (
    <div className="relative inline-block w-full">
      <img
        src={targetImage}
        alt="target1"
        className="w-full h-auto"
        onError={onImageError}
      />
      {hits?.map((hit, index) => {
        const [x, y] = getPositionInPercent(hit.point);
        if (x === 0 || y === 0) {
          return <React.Fragment key={`hit-${index}`}></React.Fragment>;
        }
        return (
          <React.Fragment key={`hit-${index}`}>
            <div
              style={{
                position: "absolute",
                left: `${x}%`,
                top: `${y}%`,
                transform: "translate(-50%, -50%)",
              }}
              className={cn([
                "w-3 h-3 border-4 border-green-500 bg-transparent rounded-full cursor-pointer",
                "hover:border-red-500",
                activeHitIndex &&
                  activeHitIndex !== index &&
                  "border-green-700/60",
                activeHitIndex === index && "border-red-500",
              ])}
              onMouseEnter={() => setActiveHitIndex(index)}
              onMouseLeave={() => setActiveHitIndex(null)}
            ></div>
            {activeHitIndex === index && (
              <div
                className={cn([
                  "absolute p-2 bg-muted rounded-md z-10 w-[220px]",
                  "transition-all duration-200 ease-in-out",
                ])}
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: "translate(-100%, 0)",
                }}
                onMouseEnter={() => setActiveHitIndex(index)}
                onMouseLeave={() => setActiveHitIndex(null)}
              >
                <div className="flex gap-2 items-center">
                  <Target size={16} strokeWidth={1} />
                  <p className="text-md font-semibold">Shot No.{hit.id}</p>
                </div>
                <div className="flex gap-2 items-center">
                  <MousePointer2 size={16} strokeWidth={1} />
                  <p className="text-md fron-semibold">Score: {hit.score}</p>
                </div>
                <div className="flex gap-2 items-center">
                  <Move3d size={16} strokeWidth={1} />
                  <p className="text-md fron-semibold break-keep">
                    Position: [x:{hit.point[0]}, y:{hit.point[1]}]
                  </p>
                </div>
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
