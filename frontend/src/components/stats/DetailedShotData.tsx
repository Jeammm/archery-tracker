import { Session } from "@/types/session";
import { Loader } from "../ui/loader";
import { Clock, Target } from "lucide-react";
import { format } from "date-fns";
import { TargetImageWithModal } from "./TargetImageWithModal";
import { PostureImageWithModal } from "./PostureImageWithModal";
import { ProcessingFailed } from "./RetryButton";

interface DetailedShotDataProps {
  sessionData: Session;
}

export const DetailedShotData = (props: DetailedShotDataProps) => {
  const { sessionData } = props;

  const { target_status, score } = sessionData;

  if (target_status === "FAILURE") {
    return <ProcessingFailed sessionData={sessionData}/>;
  }

  if (target_status !== "SUCCESS") {
    return (
      <div className="mt-4 border p-6">
        <Loader>Processing...</Loader>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {score
        ?.sort((a, b) => Number(a.id) - Number(b.id))
        .map((hit, index) => {
          return (
            <div className="border rounded-lg m-3justify-between overflow-hidden">
              <div className="flex bg-muted w-full justify-between px-3 py-1 text-muted-foreground">
                <div className="flex gap-2 items-center">
                  <Target size={18} />
                  <p className="text-lg font-semibold">Shot No. {index + 1}</p>
                </div>
                <div className="flex gap-2 items-center">
                  <Clock size={18} />
                  <p>{format(hit.hit_time, "hh:mm:ss")}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 p-2">
                <div className="flex justify-between">
                  <div className="flex flex-col gap-2">
                    <p>Head {90}°</p>
                    <p>Hip {90}°</p>
                    <div>
                      <p>Shoulders</p>
                      <div className="flex justify-between gap-4">
                        <p>Left {91}°</p>
                        <p>Right {91}°</p>
                      </div>
                    </div>

                    <div>
                      <p>Elbows</p>
                      <div className="flex justify-between gap-4">
                        <p>Left {91}°</p>
                        <p>Right {91}°</p>
                      </div>
                    </div>

                    <div>
                      <p>Legs</p>
                      <div className="flex justify-between gap-4">
                        <p>Left {91}°</p>
                        <p>Right {91}°</p>
                      </div>
                    </div>
                  </div>

                  <PostureImageWithModal hit={hit} />
                </div>
                <div className="flex justify-between">
                  <TargetImageWithModal hit={hit} />
                  <div className="flex justify-between">
                    <div>
                      <p>Score {hit.score}</p>
                      <p>TTS {2004} ms</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
    </div>
  );
};
