import { CalendarIcon, TargetIcon, ZapIcon } from "lucide-react";
import { Session } from "@/types/session";
import { formatDateTime } from "@/utils/dateTime";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Loader } from "../ui/loader";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { useTimeElapsed } from "@/hooks/useTimeElapsed";
import { RetryButton } from "./RetryButton";

interface SessionCardProps {
  sessionData: Session;
  fetchSessionsData: () => Promise<void>
}

const CARD_SIZE = "w-[200px]";

export const SessionCard = (props: SessionCardProps) => {
  const { sessionData, fetchSessionsData } = props;
  const navigate = useNavigate();

  const {
    created_at,
    score,
    _id,
    target_status,
    pose_status,
    start_process_at,
  } = sessionData;

  const totalScore = score?.reduce((sum, obj) => sum + obj.score, 0) || 0;
  const maximumScore = (score?.length || 0) * 10;

  const { elapsedTime, timeReady } = useTimeElapsed({
    startDatetime: start_process_at,
  });

  if (target_status === "FAILURE" || pose_status === "FAILURE") {
    return (
      <div
        onClick={() => {
          navigate(`/sessions/${_id}`);
        }}
        className={cn([CARD_SIZE, "shrink-0"])}
      >
        <div className="flex flex-col items-center justify-center h-full border rounded-sm gap-1">
          <h3 className="font-bold text-2xl text-red-500">SESSION ERROR</h3>
          <p className="text-red-600">{formatDateTime(created_at)}</p>
          <Badge variant="outline">
            <div className="w-1 h-1 rounded-full bg-red-500 mr-2" /> ERROR
          </Badge>
          <RetryButton sessionData={sessionData} className="mt-2" fetchSessionsData={fetchSessionsData} />
        </div>
      </div>
    );
  }

  if (target_status === "LIVE" || pose_status === "LIVE") {
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
        </div>
      </Link>
    );
  }

  if (
    target_status === "PENDING" ||
    pose_status === "PENDING" ||
    target_status === "PROCESSING" ||
    pose_status === "PROCESSING"
  ) {
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
          <CardDescription className="text-sm font-medium">
            Session Data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {totalScore} / {maximumScore}
          </div>
          <p className="text-xs text-muted-foreground">Score</p>
          <div className="mt-4 flex flex-col gap-4 text-sm">
            <div className="flex items-center">
              <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
              {formatDateTime(created_at)}
            </div>
            <div className="flex items-center">
              <TargetIcon className="mr-2 h-4 w-4 text-muted-foreground" />
              {maximumScore > 0
                ? `${(10 * totalScore) / maximumScore}% Accuracy`
                : `0% Accuracy`}
            </div>
            <div className="flex items-center col-span-2">
              <ZapIcon className="mr-2 h-4 w-4 text-muted-foreground" />
              {score?.length} Shots
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
