import { useAuth } from "@/context/AuthContext";
import { BASE_BACKEND_URL } from "@/services/baseUrl";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { RefreshCw, TriangleAlert } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { cn } from "@/lib/utils";
import { Round } from "@/types/session";

interface SessionDataProps {
  round: Round;
  className?: string;
  containerClassName?: string;
  refreshAfterRetry?: boolean;
  fetchSessionsData?: () => Promise<void>;
}

export const RetryButton = (props: SessionDataProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { round, className, refreshAfterRetry, fetchSessionsData } = props;

  const onClickRetryProcess = async (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    try {
      await axios.post(
        `${BASE_BACKEND_URL}/process-target/${round._id}`,
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
  const { round, containerClassName } = props;

  return (
    <div
      className={cn([
        "mt-4 border p-6 border-l-4 border-l-red-500 rounded-sm",
        containerClassName,
      ])}
    >
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
            {round.pose_error_message && (
              <p>Posture: {round.pose_error_message}</p>
            )}
            {round.target_error_message && (
              <p>Target: {round.target_error_message}</p>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};
