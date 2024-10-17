import { Loader } from "@/components/ui/loader";
import { useTimeElapsed } from "@/hooks/useTimeElapsed";
import { Round, Session } from "@/types/session";
import { useMemo } from "react";

interface RoundDetailsTableProps {
  targetVideoUploadingStatus: Record<string, number>;
  session: Session | null;
  roundData: Round | null;
  uploadedRoundVideo: string[];
  isCameraConnected?: boolean;
}

export const RoundDetailsTable = (props: RoundDetailsTableProps) => {
  const {
    targetVideoUploadingStatus,
    session,
    roundData,
    uploadedRoundVideo,
    isCameraConnected,
  } = props;

  const { elapsedTime, timeReady } = useTimeElapsed({
    startDatetime: roundData?.created_at,
    timeOffset: -7,
  });

  const isTableEmpty = useMemo(() => {
    return (
      Object.keys(targetVideoUploadingStatus).length === 0 &&
      session?.round_result.length === 0 &&
      !roundData
    );
  }, [roundData, session?.round_result.length, targetVideoUploadingStatus]);

  return (
    <div className="rounded-md border flex flex-col">
      <div className="border-b p-2">
        <h3 className="font-bold">Rounds Detail</h3>
      </div>

      <div className="p-2 h-1 flex-1 overflow-scroll">
        <div className="gap-2 h-1 flex-1 flex-col flex">
          {isTableEmpty && (
            <div className="w-full flex justify-center items-center flex-1">
              <p className="tracking-wider font-bold text-lg">
                {isCameraConnected
                  ? "START YOUR FIRST ROUND!"
                  : "CONNECT THE CAMERA FIRST"}
              </p>
            </div>
          )}

          {roundData && (
            <div className="rounded-md p-2 border animate-blink">
              <p>
                {`Round
              ${
                (session?.round_result.length || 0) +
                Object.keys(targetVideoUploadingStatus).length +
                1
              }
              is Recording!`}
              </p>
              {timeReady ? (
                <p>Elapse Time: {elapsedTime}</p>
              ) : (
                <p>
                  <Loader />
                </p>
              )}
            </div>
          )}

          {Object.keys(targetVideoUploadingStatus)
            .filter((round) => !uploadedRoundVideo.includes(round))
            .map((_, index) => {
              return (
                <div className="bg-slate-900 rounded-md p-2 border">
                  <p className="font-extrabold">
                    Round : {session?.round_result.length || 0 + index + 1}
                  </p>
                  <div className="flex gap-1.5 items-center">
                    <p>Poseture Video : </p>
                    <Loader containerClassName="w-fit" spinnerSize="sm">
                      <p className="text-muted-foreground">Uploading...</p>
                    </Loader>
                  </div>
                  <div className="flex gap-1.5 items-center">
                    <p>Target Video : </p>
                    <Loader containerClassName="w-fit" spinnerSize="sm">
                      <p className="text-muted-foreground">Uploading...</p>
                    </Loader>
                  </div>
                </div>
              );
            })
            .reverse()}

          {session?.round_result
            .map((round, index) => {
              return (
                <div className="bg-slate-900 rounded-md p-2 border">
                  <p className="font-extrabold">Round : {index + 1}</p>
                  <div className="flex gap-1.5 items-center">
                    <p>Poseture Video : </p>
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
              );
            })
            .reverse()}
        </div>
      </div>
    </div>
  );
};
