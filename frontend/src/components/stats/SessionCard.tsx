import { ArrowRight } from "lucide-react";
import { Session } from "@/types/session";
import { formatDateTime } from "@/utils/dateTime";
import { Link } from "react-router-dom";

interface SessionCardProps extends Session {}

export const SessionCard = (props: SessionCardProps) => {
  const { created_at, score, _id, target_status, pose_status } = props;

  const totalScore = score?.reduce((sum, obj) => sum + obj.score, 0) || 1;
  const maximumScore = score?.length || 0 * 10;

  if (target_status === "LIVE" || pose_status === "LIVE") {
    return (
      <Link
        to={`/sessions/${_id}`}
        className="group text-sm flex-shrink-0 relative bg-secondary overflow-hidden flex flex-col justify-between cursor-pointer rounded-sm"
      >
        <div>
          <p>hello</p>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={`/sessions/${_id}`}
      className="group text-sm flex-shrink-0 relative bg-secondary overflow-hidden flex flex-col justify-between cursor-pointer rounded-sm"
    >
      <div className="flex justify-between p-3 relative">
        <div className="flex flex-col gap-2">
          <div className="p-2 bg-primary">
            <p className="text-primary-foreground">
              Total Score : <span className="text-green-500">{totalScore}</span>
              /{maximumScore}
            </p>
          </div>
          <div className="p-2 bg-primary">
            <p className="text-primary-foreground">
              {formatDateTime(created_at)}
            </p>
          </div>
        </div>
        <ArrowRight className="group-hover:scale-110 mt-3" />
      </div>
      <div className="bg-primary grid grid-cols-3 text-primary-foreground relative gap-2 px-2 mt-3">
        <div className="flex flex-col justify-center items-center">
          <p>Accuracy</p>
          <p>{(10 * totalScore) / maximumScore}%</p>
        </div>
        <div className="flex flex-col justify-center items-center border-x">
          <p>Shots</p>
          <p>{score?.length}</p>
        </div>
        {/* <div className="flex flex-col justify-center items-center">
          <p>Time</p>
          <p>{getTimeDeltaInMinutes(startDate, endDate)} Minutes</p>
        </div> */}
      </div>
    </Link>
  );
};
