import { Session } from "@/types/session";
import { Loader } from "../ui/loader";
import { Clock, Target } from "lucide-react";
import { format } from "date-fns";
import { TargetImageWithModal } from "./TargetImageWithModal";
import { PostureImageWithModal } from "./PostureImageWithModal";
import { ProcessingFailed } from "./RetryButton";
import { SkeletonFeature } from "./SkeletonFeature";

interface DetailedShotDataProps {
  sessionData: Session;
}

export const DetailedShotData = (props: DetailedShotDataProps) => {
  const { sessionData } = props;

  const { round_result } = sessionData;

  // if (target_status === "FAILURE") {
  //   return <ProcessingFailed sessionData={sessionData}/>;
  // }

  // if (target_status !== "SUCCESS") {
  //   return (
  //     <div className="mt-4 border p-6">
  //       <Loader>Processing...</Loader>
  //     </div>
  //   );
  // }

  return (
    <div>
      {round_result.map((round, roundNo) => {
        if (round.target_status === "FAILURE") {
          return <ProcessingFailed round={round} />;
        }

        if (round.target_status !== "SUCCESS") {
          return (
            <div>
              <Loader>Processing...</Loader>
            </div>
          );
        }
        return (
          <div className="flex flex-col gap-4" key={round._id}>
            {round.score?.map((hit, shotNo) => {
              const features = hit.features;
              return (
                <div
                  className="border rounded-lg m-3justify-between overflow-hidden"
                  key={hit.hit_time}
                >
                  <div className="flex bg-muted w-full justify-between px-3 py-1 text-muted-foreground">
                    <div className="flex gap-2 items-center">
                      <Target size={18} />
                      <p className="text-lg font-semibold">
                        Round No. {roundNo + 1} | Shot No. {shotNo + 1}
                      </p>
                    </div>
                    <div className="flex gap-2 items-center">
                      <Clock size={18} />
                      <p>{format(hit.hit_time, "hh:mm:ss")}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 p-2">
                    <div className="flex justify-between">
                      <SkeletonFeature features={features} />

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
      })}
    </div>
  );
};
