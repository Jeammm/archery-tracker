import {
  CalendarIcon,
  Icon,
  TargetIcon,
  TriangleAlert,
  ZapIcon,
} from "lucide-react";
import { Session } from "@/types/session";
import { formatDateTime } from "@/utils/dateTime";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Loader } from "../ui/loader";
import { Badge } from "../ui/badge";
import { Button, buttonVariants } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { useTimeElapsed } from "@/hooks/useTimeElapsed";
import { Skeleton } from "../ui/skeleton";
import { targetArrow } from "@lucide/lab";

interface SessionCardProps {
  sessionData: Session;
  fetchSessionsData: () => Promise<void>;
}

export const CARD_SIZE = "w-[212px] h-[266px]";

export const SessionCard = (props: SessionCardProps) => {
  const { sessionData } = props;

  const {
    created_at,
    _id,
    processing_status,
    session_status,
    start_process_at,
    total_score,
    maximum_score,
    accuracy,
  } = sessionData;

  const { elapsedTime, timeReady } = useTimeElapsed({
    startDatetime: start_process_at,
  });

  if (session_status === "STARTED") {
    return (
      <Link
        to={`/trainingSession/live/${_id}`}
        className={cn([CARD_SIZE, "shrink-0"])}
      >
        <div className="flex flex-col items-center justify-center h-full border rounded-sm gap-1">
          <h3 className="font-bold text-2xl">SESSION</h3>
          <p>{formatDateTime(created_at)}</p>
          <Badge variant="outline">
            <div className="w-1 h-1 rounded-full bg-green-500 mr-2" /> LIVE
          </Badge>
          <Button className="mt-2">Continue Training</Button>
          <Link
            to={`/sessions/${_id}`}
            className={buttonVariants({
              variant: "link",
              className: "text-muted-foreground text-sm",
            })}
          >
            Training Results
          </Link>
        </div>
      </Link>
    );
  }

  if (session_status === "ENDED" && processing_status === "PROCESSING") {
    return (
      <Link to={`/sessions/${_id}`} className={cn([CARD_SIZE, "shrink-0"])}>
        <div className="flex flex-col items-center justify-center h-full border rounded-sm gap-1">
          <h3 className="font-bold text-2xl">ENDED SESSION</h3>
          <p>{formatDateTime(created_at)}</p>
          <Loader containerClassName="h-fit">
            <p>Processing...</p>
          </Loader>
          {timeReady && (
            <p className="text-muted-foreground">Elapsed : {elapsedTime}</p>
          )}
        </div>
      </Link>
    );
  }

  return (
    <Link to={`/sessions/${_id}`}>
      <Card
        className={cn([
          CARD_SIZE,
          "hover:scale-[1.02] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all",
        ])}
      >
        <CardHeader className="space-y-0 pb-2">
          <CardTitle className="font-bold text-2xl">COMPLETED</CardTitle>
          <div className="flex gap-1.5 items-center">
            <CardDescription className="text-sm font-mediumr">
              Session Data
            </CardDescription>
            {processing_status === "FAILURE" && (
              <TriangleAlert
                className="text-amber-500"
                size={18}
                strokeWidth={2.5}
              />
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {total_score} / {maximum_score}
          </div>
          <p className="text-xs text-muted-foreground">Score</p>
          <div className="mt-4 flex flex-col gap-4 text-sm">
            <div className="flex items-center">
              <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
              {formatDateTime(created_at)}
            </div>
            <div className="flex items-center">
              <TargetIcon className="mr-2 h-4 w-4 text-muted-foreground" />
              {`${Math.floor((accuracy || 0) * 100)}% Accuracy`}
            </div>
            <div className="flex items-center col-span-2">
              <ZapIcon className="mr-2 h-4 w-4 text-muted-foreground" />
              {(maximum_score || 0) / 10} Shots
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export const CardSkeleton = () => {
  return (
    <Card className={CARD_SIZE}>
      <CardHeader className="space-y-0 pb-2">
        <Skeleton className="w-[162px] h-[32px] mb-3" />
        <Skeleton className="w-[85px] h-[20px]" />
      </CardHeader>
      <CardContent>
        <Skeleton className="w-[100px] h-[32px]" />
        <Skeleton className="w-[40px] h-[16px] mt-1.5" />
        <div className="mt-4 flex flex-col gap-2 text-sm">
          <Skeleton className="w-[150px] h-[25px]" />
          <Skeleton className="w-[150px] h-[25px]" />
          <Skeleton className="w-[150px] h-[25px]" />
        </div>
      </CardContent>
    </Card>
  );
};

export const CardEmpty = () => {
  return (
    <div className="w-full border rounded-lg flex flex-col justify-center items-center gap-4 p-8">
      <h3 className="text-xl text-muted-foreground font-semibold">
        Welcome to archery tracker!
      </h3>
      <p className="text-muted-foreground text-sm">
        Start your first session now
      </p>
      <Link to="/trainingSession">
        <Button>
          <div className="flex gap-2 items-center">
            <Icon iconNode={targetArrow} />
            <p>Start Training</p>
          </div>
        </Button>
      </Link>
    </div>
  );
};
