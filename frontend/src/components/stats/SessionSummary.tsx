import { Hit, Session } from "@/types/session";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";
import { MousePointer2, Move3d, Target } from "lucide-react";

interface SessionSummaryProps {
  sessionData: Session;
}

export const SessionSummary = (props: SessionSummaryProps) => {
  const { sessionData } = props;

  const { round_result } = sessionData;

  const [activeHitId, setActiveHitId] = useState<string | null>(null);

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
          <img src={round_result?.[0].score?.[0]?.pose_image_url} alt="" />
        </div>
        <div className="grid grid-cols-2 gap-x-4">
          <p>Head {90}°</p>
          <p>Left shoulder {91}°</p>
          <p>Left elbow {13}°</p>
          <p>Left leg {78}°</p>

          <p>Hip {90}°</p>
          <p>Right shoulder {91}°</p>
          <p>Right elbow {180}°</p>
          <p>Right leg {70}°</p>
        </div>
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
          <p>{112}</p>
          <p>Average Score</p>
          <p> {8.7}</p>
          <p>Average TTS</p>
          <p> {2012} ms</p>
          <p>Accuracy </p>
          <p>{93} %</p>
          <p>Time </p>
          <p>{35} min</p>
        </div>
      </div>
    </div>
  );
};
