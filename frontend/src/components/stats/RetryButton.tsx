import { useAuth } from "@/context/AuthContext";
import { BASE_BACKEND_URL } from "@/services/baseUrl";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { RefreshCw, TriangleAlert } from "lucide-react";
import { Session } from "@/types/session";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { cn } from "@/lib/utils";

interface SessionDataProps {
  sessionData: Session;
  className?: string;
  refreshAfterRetry?: boolean;
  fetchSessionsData?: () => Promise<void>;
}

export const RetryButton = (props: SessionDataProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { sessionData, className, refreshAfterRetry, fetchSessionsData } =
    props;

  const onClickRetryProcess = async (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    try {
      await axios.post(
        `${BASE_BACKEND_URL}/process-target/${sessionData._id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${user?.token || ""}`,
          },
        }
      );
      refreshAfterRetry && navigate(0);
      fetchSessionsData && fetchSessionsData();
    } catch (error) {
      console.error("Error ending session:", error);
    }
  };

  return (
    <Button
      onClick={onClickRetryProcess}
      className={cn(["gap-2", className])}
      variant="destructive"
    >
      <RefreshCw />
      Retry
    </Button>
  );
};

export const ProcessingFailed = (props: SessionDataProps) => {
  const { sessionData } = props;

  return (
    <div className="mt-4 border p-6 border-l-4 border-l-red-500 rounded-sm">
      <div className="flex justify-between items-center">
        <div>
          <div className="flex gap-2 text-red-500 items-center">
            <TriangleAlert size={18} />
            <p>There was an error during processing video data</p>
          </div>
          <p className="text-muted-foreground">
            Please try processing data again
          </p>
        </div>
        <RetryButton {...props} refreshAfterRetry />
      </div>
      <Accordion type="single" collapsible>
        <AccordionItem value="errorMessage">
          <AccordionTrigger>Errors</AccordionTrigger>
          <AccordionContent>
            {sessionData.pose_error_message && (
              <p>Posture: {sessionData.pose_error_message}</p>
            )}
            {sessionData.target_error_message && (
              <p>Target: {sessionData.target_error_message}</p>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};
