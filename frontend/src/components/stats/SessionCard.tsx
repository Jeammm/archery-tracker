import { CalendarIcon, TargetIcon, ZapIcon } from "lucide-react";
import { Session } from "@/types/session";
import { formatDateTime } from "@/utils/dateTime";
import { Link } from "react-router-dom";
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

interface SessionCardProps extends Session {}

const CARD_SIZE = "w-[200px]";

export const SessionCard = (props: SessionCardProps) => {
  const { created_at, score, _id, target_status, pose_status } = props;

  const totalScore = score?.reduce((sum, obj) => sum + obj.score, 0) || 1;
  const maximumScore = (score?.length || 0) * 10;

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

  if (target_status === "PENDING" || pose_status === "PENDING") {
    return (
      <Link to={`/sessions/${_id}`} className={cn([CARD_SIZE, "shrink-0"])}>
        <div className="flex flex-col items-center justify-center h-full border rounded-sm gap-1">
          <h3 className="font-bold text-2xl">ENDED SESSION</h3>
          <p>{formatDateTime(created_at)}</p>
          <Loader containerClassName="h-fit">
            <p>Processing...</p>
          </Loader>
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
              {(10 * totalScore) / maximumScore}% Accuracy
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
