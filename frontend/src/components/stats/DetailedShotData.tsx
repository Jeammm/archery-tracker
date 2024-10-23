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
}

export const DetailedShotData = (props: DetailedShotDataProps) => {
  const { sessionData } = props;

  const { round_result } = sessionData;

  const totalLength = round_result.length;

  return (
    <div className="mt-6 flex flex-col">
      {round_result.map((round, roundNo) => {
        if (round.target_status === "FAILURE") {
          return (
            <TimelineWrapper
              roundNo={roundNo}
              roundLength={totalLength}
              type="error"
              timestamp={round.created_at}
            >
              <ProcessingFailed
                round={round}
                key={round._id}
                containerClassName="mb-4 mt-0 w-full"
              />
            </TimelineWrapper>
          );
        }

        if (round.target_status !== "SUCCESS") {
          return (
            <TimelineWrapper
              roundNo={roundNo}
              roundLength={totalLength}
              type="loading"
              timestamp={round.created_at}
            >
              <div
                className="rounded-lg w-full p-3 border mb-4"
                key={round._id}
              >
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
              timestamp={round.created_at}
            >
              <div
                className="rounded-lg w-full p-3 border border-l-amber-600 border-l-4 mb-4"
                key={round._id}
              >
                <p className="italic font-bold text-muted-foreground text-lg">
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
                  <div className="border rounded-lg justify-between overflow-hidden mb-4">
                    <div className="flex bg-muted w-full justify-between px-3 py-1 text-muted-foreground">
                      <div className="flex gap-2 items-center">
                        <Target size={18} />
                        <p className="text-lg font-semibold">
                          Round No. {roundNo + 1} | Shot No. {shotNo + 1}
                        </p>
                      </div>
                      <div className="flex gap-2 items-center">
                        <p className="font-semibold">{hit.score} Points</p>
                        <p>|</p>
                        <p>TTS {2003} ms</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 p-2">
                      <SkeletonFeature features={hit.features} />

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
      <div className="w-[75px] shrink-0 relative">
        {timestamp && (
          <div className="text-xs text-muted-foreground absolute top-3">
            <div className="flex gap-1 items-center ">
              <Clock size={10} />
              <p>{format(timestamp, "hh:mm:ss")}</p>
            </div>
            <p>{timeAgo(timestamp)}</p>
          </div>
        )}
      </div>
      <div className="relative px-6">
        <LeftLine />
        <LeftDot />
      </div>
      {children}
    </div>
  );
};
