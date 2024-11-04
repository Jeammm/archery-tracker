import { format } from "date-fns";
import { Round, Session } from "@/types/session";
import { Button, buttonVariants } from "../ui/button";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { useMemo } from "react";
import { SetStateActionType } from "@/types/constant";
import { HelpCircle } from "lucide-react";

interface SessionInitiateHeaderProps {
  session: Session;
  targetVideoUploadingStatus: Record<string, number>;
  roundData: Round | null;
  onClickEndSession: (isRoundExist: boolean) => void;
  setIsTutorialManualOpen: SetStateActionType<boolean>;
}

export const SessionInitiateHeader = (props: SessionInitiateHeaderProps) => {
  const {
    session,
    targetVideoUploadingStatus,
    roundData,
    onClickEndSession,
    setIsTutorialManualOpen,
  } = props;

  const isRoundExisted = useMemo(() => {
    return !(
      Object.keys(targetVideoUploadingStatus).length === 0 &&
      session?.round_result.length === 0 &&
      !roundData
    );
  }, [roundData, session?.round_result.length, targetVideoUploadingStatus]);

  return (
    <div className="flex justify-between">
      <div>
        <div className="flex gap-3 items-center">
          <h1 className="text-4xl font-bold">Start Training!</h1>
          <HelpCircle
            size={20}
            onClick={() => setIsTutorialManualOpen(true)}
            className="cursor-pointer"
          />
        </div>

        <p className="mt-2 text-muted-foreground">
          Start time: {format(session.created_at, "hh:mm a 'at' do MMMM yyyy")}
        </p>
      </div>
      <div className="flex gap-2">
        <Link
          to={`/sessions/${session._id}`}
          className={buttonVariants({
            variant: "default",
          })}
        >
          Session Details
        </Link>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="destructive" className="w-fit">
              End session
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>End this session</DialogTitle>
              <DialogDescription>
                {isRoundExisted
                  ? "This session will be marked as ended. You can rest now"
                  : "This session does not contain any rounds. Ending the session now will result in its deletion."}
              </DialogDescription>
            </DialogHeader>

            <DialogFooter>
              <DialogClose>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <DialogClose>
                <Button
                  variant="destructive"
                  onClick={() => onClickEndSession(isRoundExisted)}
                >
                  End session
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
