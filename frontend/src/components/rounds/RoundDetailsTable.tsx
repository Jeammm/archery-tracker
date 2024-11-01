import { Loader } from "@/components/ui/loader";
import { Progress } from "@/components/ui/progress";
import { useTimeElapsed } from "@/hooks/useTimeElapsed";
import { cn } from "@/lib/utils";
import { Round, Session } from "@/types/session";
import { useMemo } from "react";

interface RoundDetailsTableProps {
  targetVideoUploadingStatus: Record<string, number>;
  session: Session | null;
  roundData: Round | null;
  isCameraConnected?: boolean;
  containerClassName?: string;
  recording: boolean;
}

export const RoundDetailsTable = (props: RoundDetailsTableProps) => {
  const {
    targetVideoUploadingStatus,
    session,
    roundData,
    isCameraConnected,
    containerClassName,
    recording,
  } = props;

  const { elapsedTime, timeReady } = useTimeElapsed({
    startDatetime: roundData?.created_at,
  });

  const isTableEmpty = useMemo(() => {
    return (
      Object.keys(targetVideoUploadingStatus).length === 0 &&
      session?.round_result.length === 0 &&
      !roundData
    );
  }, [roundData, session?.round_result.length, targetVideoUploadingStatus]);

  return (
    <div
      className={cn([
        "rounded-md border flex flex-col flex-1",
        containerClassName,
      ])}
    >
      <div className="border-b p-2 bg-primary text-primary-foreground rounded-t-md">
        <h3 className="font-bold">Rounds Detail</h3>
      </div>

      <div className="p-2 h-1 flex-1 overflow-scroll">
        <div
          className={cn([
            "gap-2 flex-1 flex-col flex",
            isTableEmpty ? "h-[150px]" : "h-1",
          ])}
        >
          {isTableEmpty && (
            <div className="w-full flex justify-center items-center flex-1">
              <p className="tracking-wider font-bold text-lg h-fit">
                {isCameraConnected
                  ? "START YOUR FIRST ROUND!"
                  : "CONNECT THE CAMERA FIRST"}
              </p>
            </div>
          )}

          {recording && (
            <div className="rounded-md p-2 border animate-blink h-[90px]">
              <p>
                {`Round
              ${(session?.round_result.length || 0) + 1}
              is Recording!`}
              </p>
              {timeReady ? (
                <p>Elapse Time: {elapsedTime}</p>
              ) : (
                <p>Starting...</p>
              )}
            </div>
          )}

          {Object.keys(targetVideoUploadingStatus)
            .filter(
              (round) =>
                !session?.round_result?.some((result) => result._id === round)
            )
            .map((round, index) => {
              return (
                <div
                  className="bg-secondary text-secondary-foreground rounded-md p-2 border"
                  key={`uploading-round-${round}`}
                >
                  <p className="font-extrabold">
                    Round : {(session?.round_result.length || 0) + index + 1}{" "}
                    Uploading...
                  </p>
                  <Progress value={targetVideoUploadingStatus[round]} />
                </div>
              );
            })
            .reverse()}

          {session?.round_result
            .map((round, index) => {
              return (
                <div
                  className={cn([
                    "bg-secondary text-secondary-foreground rounded-md p-2 border flex",
                    isCameraConnected
                      ? "flex-col"
                      : "justify-between items-center",
                  ])}
                  key={`uploaded-round-${round._id}`}
                >
                  <div>
                    <p className="font-extrabold">Round : {index + 1}</p>
                    <div className="flex gap-1.5 items-center">
                      <p>Posture Video : </p>
                      {round.pose_status === "FAILURE" ? (
                        <p className="text-muted-foreground">Failed</p>
                      ) : round.pose_status !== "SUCCESS" ? (
                        <Loader containerClassName="w-fit" spinnerSize="sm">
                          <p className="text-muted-foreground">Processing...</p>
                        </Loader>
                      ) : (
                        <p className="text-muted-foreground">Success</p>
                      )}
                    </div>
                    <div className="flex gap-1.5 items-center">
                      <p>Target Video : </p>
                      {round.target_status === "FAILURE" ? (
                        <p className="text-muted-foreground">Failed</p>
                      ) : round.target_status !== "SUCCESS" ? (
                        <Loader containerClassName="w-fit" spinnerSize="sm">
                          <p className="text-muted-foreground">Processing...</p>
                        </Loader>
                      ) : (
                        <p className="text-muted-foreground">Success</p>
                      )}
                    </div>
                  </div>
                  <div
                    className={cn([
                      "flex gap-2",
                      isCameraConnected ? "flex-col" : "",
                    ])}
                  >
                    {round.score && (
                      <div
                        className={cn([
                          isCameraConnected
                            ? "border-t pt-1 mt-1"
                            : "border-l px-2",
                        ])}
                      >
                        <p>
                          Shot :{" "}
                          <span className="text-muted-foreground">
                            {round.score.length || 0}
                          </span>
                        </p>
                        <p>
                          Total Score :{" "}
                          <span className="text-muted-foreground">
                            {round.total_score}
                          </span>
                        </p>
                        <p>
                          Accuracy :{" "}
                          <span className="text-muted-foreground">
                            {round.accuracy}
                          </span>
                        </p>
                      </div>
                    )}
                    <div className="flex gap-1">
                      {round?.score?.[0]?.pose_image_url && (
                        <div className="h-[80px] w-auto rounded-sm border aspect-square overflow-hidden">
                          <img
                            src={round.score[0].pose_image_url}
                            alt="posture"
                            className="object-cover w-full h-full"
                          />
                        </div>
                      )}
                      {round?.score?.[0]?.target_image_url && (
                        <div className="h-[80px] w-auto rounded-sm border aspect-square overflow-hidden">
                          <img
                            src={round.score[0].target_image_url}
                            alt="target"
                            className="object-cover w-full h-full"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
            .reverse()}
        </div>
      </div>
    </div>
  );
};
