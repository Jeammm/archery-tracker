import { Session } from "@/types/session";
import { Loader } from "../ui/loader";
import { Clock, Target } from "lucide-react";
import { format } from "date-fns";
import { TargetImageWithModal } from "./TargetImageWithModal";
import { PostureImageWithModal } from "./PostureImageWithModal";
import { ProcessingFailed } from "./RetryButton";
import { SkeletonFeature } from "./SkeletonFeature";
import React, { ReactNode } from "react";
import { timeAgo } from "@/utils/dateTime";
import { isNil } from "lodash";

interface DetailedShotDataProps {
  sessionData: Session;
  fetchSessionsData: () => Promise<void>;
}

export const DetailedShotData = (props: DetailedShotDataProps) => {
  const { sessionData, fetchSessionsData } = props;

  const { round_result } = sessionData;

  const totalLength = round_result.length;

  return (
    <div className="mt-1 md:mt-6 flex flex-col">
      {round_result.map((round, roundNo) => {
        if (
          round.target_status === "FAILURE" ||
          round.capture_status === "FAILURE" ||
          round.pose_status === "FAILURE"
        ) {
          return (
            <TimelineWrapper
              roundNo={roundNo}
              key={round._id}
              roundLength={totalLength}
              type="error"
              timestamp={round.created_at}
            >
              <ProcessingFailed
                round={round}
                containerClassName="mb-4 mt-0 w-full bg-background drop-shadow-md"
                fetchSessionsData={fetchSessionsData}
                refreshAfterRetry
              />
            </TimelineWrapper>
          );
        }

        if (
          round.target_status === "PROCESSING" ||
          (round.capture_status && round.capture_status !== "SUCCESS")
        ) {
          return (
            <TimelineWrapper
              roundNo={roundNo}
              roundLength={totalLength}
              type="loading"
              key={round._id}
              timestamp={round.created_at}
            >
              <div className="rounded-lg w-full p-3 border mb-4 bg-background drop-shadow-md">
                <Loader>Round {roundNo + 1} Processing...</Loader>
              </div>
            </TimelineWrapper>
          );
        }

        if (round.score?.length === 0) {
          return (
            <TimelineWrapper
              roundNo={roundNo}
              roundLength={totalLength}
              type="empty"
              key={round._id}
              timestamp={round.created_at}
            >
              <div className="rounded-lg w-full p-3 border border-l-amber-600 border-l-4 mb-4 bg-background drop-shadow-md">
                <p className="italic font-semibold text-muted-foreground text-lg">
                  No hit detected on Round No.{roundNo + 1}
                </p>
              </div>
            </TimelineWrapper>
          );
        }

        return (
          <React.Fragment key={round._id}>
            {round.score?.map((hit, shotNo) => {
              return (
                <TimelineWrapper
                  roundNo={roundNo}
                  shotNo={shotNo}
                  roundLength={totalLength}
                  shotLength={round.score?.length || 0}
                  type="success"
                  key={hit.hit_time}
                  timestamp={hit.hit_time}
                >
                  <div className="border rounded-lg justify-between overflow-hidden mb-4 drop-shadow-md bg-background w-full">
                    <div className="bg-primary w-full text-primary-foreground">
                      <div className="flex justify-between px-3 py-1 ">
                        <div className="flex gap-2 items-center">
                          <Target size={18} />
                          <p className="text-lg font-semibold">
                            Round No. {roundNo + 1} | Shot No. {shotNo + 1}
                          </p>
                        </div>
                        <div className="flex gap-2 items-center font-semibold">
                          <p>{hit.score} Points</p>
                        </div>
                      </div>
                      {hit.hit_time && (
                        <div className="flex w-full justify-between px-3 py-1 md:hidden">
                          <div className="flex gap-1 items-center ">
                            <Clock size={10} />
                            <p>{format(hit.hit_time, "hh:mm:ss")}</p>
                          </div>
                          <p>{timeAgo(hit.hit_time)}</p>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 p-2">
                      <div className="col-span-1 md:col-span-2 xl:col-span-1">
                        <SkeletonFeature features={hit.features} />
                      </div>
                      <PostureImageWithModal hit={hit} />
                      <TargetImageWithModal hit={hit} />
                    </div>
                  </div>
                </TimelineWrapper>
              );
            })}
          </React.Fragment>
        );
      })}
    </div>
  );
};

interface TimelineWrapperProps {
  roundNo: number;
  shotNo?: number;
  roundLength: number;
  shotLength?: number;
  type: "loading" | "error" | "success" | "empty";
  children: ReactNode;
  timestamp?: string;
}

const TimelineWrapper = (props: TimelineWrapperProps) => {
  const {
    roundNo,
    roundLength,
    shotNo,
    shotLength,
    children,
    type,
    timestamp,
  } = props;

  const LeftLine = () => {
    if (!isNil(shotNo) && !isNil(shotLength)) {
      if (roundNo === 0 && shotNo === 0) {
        return (
          <div className="w-1.5 h-full bg-muted absolute top-3 left-[50%] -translate-x-[50%]" />
        );
      }

      if (roundLength === 1 && shotLength === 1) {
        return <></>;
      }

      if (roundNo === roundLength - 1 && shotNo === shotLength - 1)
        return (
          <div className="w-1.5 h-3 bg-muted absolute top-0 left-[50%] -translate-x-[50%]" />
        );

      return (
        <div className="w-1.5 h-full bg-muted absolute top-0 left-[50%] -translate-x-[50%]" />
      );
    }

    if (roundLength === 1) {
      return <></>;
    }

    if (roundNo === 0)
      return (
        <div className="w-1.5 h-full bg-muted absolute top-3 left-[50%] -translate-x-[50%]" />
      );

    if (roundNo === roundLength - 1)
      return (
        <div className="w-1.5 h-3 bg-muted absolute top-0 left-[50%] -translate-x-[50%]" />
      );

    return (
      <div className="w-1.5 h-full bg-muted absolute top-0 left-[50%] -translate-x-[50%]" />
    );
  };

  const LeftDot = () => {
    if (type === "loading")
      return (
        <div className="w-4 h-4 bg-yellow-500 rounded-full top-3 absolute -translate-x-[50%]" />
      );
    if (type === "empty")
      return (
        <div className="w-4 h-4 bg-amber-600 rounded-full top-3 absolute -translate-x-[50%]" />
      );
    if (type === "error")
      return (
        <div className="w-4 h-4 bg-red-500 rounded-full top-3 absolute -translate-x-[50%]" />
      );
    if (type === "success")
      return (
        <div className="w-4 h-4 bg-green-700 rounded-full top-3 absolute -translate-x-[50%]" />
      );
  };

  return (
    <div className="flex">
      <div className="w-[90px] shrink-0 relative hidden md:block">
        <div className="text-xs text-muted-foreground absolute top-3">
          <div className="flex gap-1 items-center ">
            <Clock size={10} />
            <p>{timestamp ? format(timestamp, "hh:mm:ss") : "No time data"}</p>
          </div>
          <p>{timestamp ? timeAgo(timestamp) : "Manual shot"}</p>
        </div>
      </div>
      <div className="relative px-4">
        <LeftLine />
        <LeftDot />
      </div>
      {children}
    </div>
  );
};
