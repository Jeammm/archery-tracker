import { Session } from "@/types/session";
import { Loader } from "../ui/loader";

interface SessionSummaryProps {
  sessionData: Session;
}

export const SessionSummary = (props: SessionSummaryProps) => {
  const { sessionData } = props;

  const { target_status } = sessionData;

  if (target_status !== "SUCCESS") {
    return (
      <div className="mt-4 border p-6">
        <Loader>Processing...</Loader>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <h2>Summary</h2>
      <div className="grid grid-cols-2 gap-4 p-8">
        <div className="rounded-md bg-secondary text-secondary-foreground flex flex-col items-center">
          <div className="m-8">
            <img
              src="https://static.toiimg.com/thumb/resizemode-4,width-1200,height-900,msid-103196097/103196097.jpg"
              alt=""
            />
          </div>
          <div className="grid grid-cols-2 gap-x-4">
            <p>Head {90}°</p>
            <p>Left shoulder {91}°</p>
            <p>Left elbow {13}°</p>
            <p>Left leg {78}°</p>

            <p>Hip {90}°</p>
            <p>Right shoulder {91}°</p>
            <p>Right elbow {180}°</p>
            <p>Right leg {70}°</p>
          </div>
        </div>
        <div className="rounded-md bg-secondary text-secondary-foreground flex flex-col items-center">
          <div className="m-8">
            <img
              src="https://static.toiimg.com/thumb/resizemode-4,width-1200,height-900,msid-103196097/103196097.jpg"
              alt=""
            />
          </div>
          <div className="grid grid-cols-2 w-full text-center">
            <p>Total Score </p>
            <p>{112}</p>
            <p>Average Score</p>
            <p> {8.7}</p>
            <p>Average TTS</p>
            <p> {2012} ms</p>
            <p>Accuracy </p>
            <p>{93} %</p>
            <p>Time </p>
            <p>{35} min</p>
          </div>
        </div>
      </div>
    </div>
  );
};
