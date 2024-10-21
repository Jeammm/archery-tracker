import { Hit, Session } from "@/types/session";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";
import { MousePointer2, Move3d, Target } from "lucide-react";
import { SkeletonFeature } from "./SkeletonFeature";

interface SessionSummaryProps {
  sessionData: Session;
}

export const SessionSummary = (props: SessionSummaryProps) => {
  const { sessionData } = props;

  const { round_result, features } = sessionData;

  const [activeHitId, setActiveHitId] = useState<number | null>(null);

  const allHits = useMemo(() => {
    const hits: Hit[] = [];

    round_result.map((round) => round.score?.map((hit) => hits.push(hit)));

    return hits;
  }, [round_result]);

  const getPositionInPercent = (point: number[]) => {
    const x = (point[0] / 1920) * 100;
    const y = (point[1] / 1080) * 100;

    return [x, y];
  };

  return (
    <div className="grid grid-cols-2 gap-4 mt-6">
      <div className="rounded-md bg-secondary text-secondary-foreground flex flex-col items-center">
        <div className="m-8">
          <img
            src={round_result?.[0].score?.[0]?.pose_image_url}
            alt=""
            className="w-full h-auto"
          />
        </div>
        <SkeletonFeature features={features} />
      </div>
      <div className="rounded-md bg-secondary text-secondary-foreground flex flex-col items-center">
        <div className="relative inline-block">
          <img
            src={round_result?.[0].score?.[0]?.target_image_url}
            alt="target1"
            className="w-full h-auto"
          />
          {allHits?.map((hit) => {
            const [x, y] = getPositionInPercent(hit.point);
            return (
              <>
                <div
                  key={hit.id}
                  style={{
                    position: "absolute",
                    left: `${x}%`,
                    top: `${y}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                  className={cn([
                    "w-3 h-3 border-4 border-green-500 bg-transparent rounded-full cursor-pointer",
                    "hover:border-red-500",
                    activeHitId &&
                      activeHitId !== hit.id &&
                      "border-green-700/60",
                  ])}
                  onMouseEnter={() => setActiveHitId(hit.id)}
                  onMouseLeave={() => setActiveHitId(null)}
                ></div>
                {activeHitId === hit.id && (
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
                    onMouseEnter={() => setActiveHitId(hit.id)}
                    onMouseLeave={() => setActiveHitId(null)}
                  >
                    <div className="flex gap-2 items-center">
                      <Target size={16} strokeWidth={1} />
                      <p className="text-md font-semibold">Shot No.{hit.id}</p>
                    </div>
                    <div className="flex gap-2 items-center">
                      <MousePointer2 size={16} strokeWidth={1} />
                      <p className="text-md fron-semibold">
                        Score: {hit.score}
                      </p>
                    </div>
                    <div className="flex gap-2 items-center">
                      <Move3d size={16} strokeWidth={1} />
                      <p className="text-md fron-semibold break-keep">
                        Position: [x:{hit.point[0]}, y:{hit.point[1]}]
                      </p>
                    </div>
                  </div>
                )}
              </>
            );
          })}
        </div>
        <div className="grid grid-cols-2 w-full text-center">
          <p>Total Score </p>
          <p>{sessionData.total_score}</p>
          <p>Average Score</p>
          <p>
            {" "}
            {sessionData.total_score && sessionData.maximum_score
              ? (sessionData.total_score / sessionData.maximum_score) * 10
              : 0}
          </p>
          <p>Average TTS</p>
          <p> {2012} ms</p>
          <p>Accuracy </p>
          <p>{sessionData.accuracy ? sessionData.accuracy * 100 : 0} %</p>
          <p>Time </p>
          <p>{35} min</p>
        </div>
      </div>
    </div>
  );
};
