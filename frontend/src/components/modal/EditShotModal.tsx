import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";
import { BASE_BACKEND_URL } from "@/services/baseUrl";
import { SetStateActionType } from "@/types/constant";
import { Hit } from "@/types/session";
import axios from "axios";
import { isNil } from "lodash";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { ArrowBigLeft, ArrowBigRight } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

interface EditShotModalProps {
  isEditShotModalOpen: boolean;
  setIsEditShotModalOpen: SetStateActionType<boolean>;
  hit: Hit | null;
  roundId: string;
  poseCanvasRef: React.RefObject<HTMLCanvasElement>;
  targetCanvasRef: React.RefObject<HTMLCanvasElement>;
  fetchSessionData: () => void;
  currentTime: number;
  seekToFrame: (frameNumber: number) => void;
  captureVideos: () => void;
}

export const EditShotModal = (props: EditShotModalProps) => {
  const { user } = useAuth();

  const {
    hit,
    setIsEditShotModalOpen,
    isEditShotModalOpen,
    roundId,
    poseCanvasRef,
    targetCanvasRef,
    seekToFrame,
    fetchSessionData,
    captureVideos,
  } = props;

  const [currentShotScore, setCurrentShotScore] = useState<number | null>(null);
  const [currentFrame, setCurrentFrame] = useState<number | null>(null);
  const [hitLocation, setHitLocation] = useState<{
    x: number | null;
    y: number | null;
  }>({ x: null, y: null });

  const submitShotDataChange = async () => {
    if (!currentFrame || !hit) {
      return;
    }
    try {
      await axios.post(
        `${BASE_BACKEND_URL}/edit-manual-shot/${roundId}/${hit.id}`,
        {
          frame: currentFrame,
          score: currentShotScore || 0,
          pointX: hitLocation.x && hitLocation.y ? hitLocation.x : 0,
          pointY: hitLocation.x && hitLocation.y ? hitLocation.y : 0,
        },
        {
          headers: {
            Authorization: `Bearer ${user?.token || ""}`,
          },
        }
      );
      toast({
        title: "Edit shot data successfully!",
        description: "Your shot detail has been updated.",
        variant: "success",
      });
      setCurrentShotScore(null);
      setHitLocation({ x: null, y: null });
      fetchSessionData();
    } catch (error) {
      toast({
        title: "Edit shot data Failed",
        description: `Error: ${error}`,
        variant: "destructive",
      });
    }
  };

  const onClickPreviousFrame = () => {
    const newFrame = (currentFrame || 0) - 1;
    seekToFrame(newFrame);
    setCurrentFrame(newFrame);
  };

  const onClickNextFrame = () => {
    const newFrame = (currentFrame || 0) + 1;
    seekToFrame(newFrame);
    setCurrentFrame(newFrame);
  };

  useEffect(() => {
    if (isNil(hit)) {
      return;
    }
    setCurrentShotScore(hit.score);
    setCurrentFrame(hit.frame);
    setHitLocation({ x: hit.point[0], y: hit.point[1] });
  }, [hit]);

  useEffect(() => {
    if (isEditShotModalOpen) {
      setTimeout(() => {
        captureVideos();
      }, 0);
    }
  }, [captureVideos, isEditShotModalOpen]);

  return (
    <Dialog
      modal
      open={isEditShotModalOpen}
      onOpenChange={setIsEditShotModalOpen}
    >
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Edit Shot Detail</DialogTitle>
          <DialogDescription>
            Wrong Shot Detail? Don't worry, you can edit this shot manually.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2">
          <div className="flex-1 rounded-md border overflow-hidden">
            <canvas ref={poseCanvasRef} className="w-full h-full" />
          </div>
          <div className="flex-1 rounded-md border overflow-hidden">
            <canvas ref={targetCanvasRef} className="w-full h-full" />
          </div>
        </div>
        <div>
          <div className="flex gap-2 w-full mb-4">
            <div className="flex-1">
              <p className="mb-1.5">Score</p>
              <Input
                value={String(currentShotScore)}
                onChange={(event) => {
                  const score = Number(event.target.value);
                  if (!isNaN(score)) {
                    setCurrentShotScore(score);
                  }
                }}
              />
            </div>
            <div className="flex-1">
              <p className="mb-1.5">Time</p>
              <div className="flex items-center">
                <ArrowBigLeft onClick={onClickPreviousFrame} />
                <Input value={String(currentFrame?.toFixed(2))} readOnly />
                <ArrowBigRight onClick={onClickNextFrame} />
              </div>
            </div>
          </div>
          <div className="flex gap-4 items-center">
            <p>Location</p>
            <div className="flex gap-1 whitespace-nowrap items-center">
              <p>x : </p>
              <Input
                value={String(!isNil(hitLocation.x) ? hitLocation.x : "")}
                onChange={(event) => {
                  const xCoor = Number(event.target.value);
                  if (!isNaN(xCoor)) {
                    setHitLocation((prev) => ({
                      ...prev,
                      x: xCoor,
                    }));
                  }
                }}
              />
            </div>
            <div className="flex gap-1 whitespace-nowrap items-center">
              <p>y : </p>
              <Input
                value={String(!isNil(hitLocation.y) ? hitLocation.y : "")}
                onChange={(event) => {
                  const yCoor = Number(event.target.value);
                  if (!isNaN(yCoor)) {
                    setHitLocation((prev) => ({
                      ...prev,
                      y: yCoor,
                    }));
                  }
                }}
              />
            </div>
          </div>
          <DialogClose className="w-full mt-4" asChild>
            <Button className="w-full" onClick={submitShotDataChange}>
              Submit
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
};
