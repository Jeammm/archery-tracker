import { useAuth } from "@/context/AuthContext";
import { BASE_BACKEND_URL } from "@/services/baseUrl";
import axios from "axios";
import { isNil } from "lodash";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { toast } from "@/hooks/use-toast";
import { FPS, SetStateActionType } from "@/types/constant";

interface AddMissingShotModalProps {
  isAddShotModalOpen: boolean;
  setIsAddShotModalOpen: SetStateActionType<boolean>;
  currentTime: number;
  poseCanvasRef: React.RefObject<HTMLCanvasElement>;
  targetCanvasRef: React.RefObject<HTMLCanvasElement>;
  roundId: string;
  fetchSessionData: () => void;
  captureVideos: () => void;
}

export const AddMissingShotModal = (props: AddMissingShotModalProps) => {
  const { user } = useAuth();

  const {
    isAddShotModalOpen,
    setIsAddShotModalOpen,
    currentTime,
    poseCanvasRef,
    targetCanvasRef,
    roundId,
    fetchSessionData,
    captureVideos,
  } = props;

  const [scoreInput, setScoreInput] = useState<number | null>(null);
  const [hitLocation, setHitLocation] = useState<{
    x: number | null;
    y: number | null;
  }>({ x: null, y: null });

  const submitManualShot = async () => {
    try {
      await axios.post(
        `${BASE_BACKEND_URL}/add-manual-shot/${roundId}`,
        {
          frame: (currentTime * FPS).toFixed(0),
          score: scoreInput || 0,
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
        title: "Add new shot successfully!",
        description: `Your new shot with score of ${scoreInput} has been added @${currentTime}.`,
        variant: "success",
      });
      setScoreInput(null);
      fetchSessionData();
      setHitLocation({ x: null, y: null });
    } catch (error) {
      toast({
        title: "Add new shot Failed",
        description: `Error: ${error}`,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (isAddShotModalOpen) {
      setTimeout(() => {
        captureVideos();
      }, 0);
    }
  }, [captureVideos, isAddShotModalOpen]);

  return (
    <Dialog open={isAddShotModalOpen} onOpenChange={setIsAddShotModalOpen}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Add missing shot</DialogTitle>
          <DialogDescription>
            Shot Missing? Don't worry, you can add a new shot manually.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2">
          <div className="flex-1 rounded-md border overflow-hidden">
            <canvas ref={poseCanvasRef} className="w-full h-full bg-red-500" />
          </div>
          <div className="flex-1 rounded-md border overflow-hidden">
            <canvas
              ref={targetCanvasRef}
              className="w-full h-full bg-red-500"
            />
          </div>
        </div>
        <div>
          <div className="flex gap-2 w-full mb-4">
            <div className="flex-1">
              <p className="mb-1.5">Score</p>
              <Input
                value={String(!isNil(scoreInput) ? scoreInput : "")}
                onChange={(event) => {
                  const score = Number(event.target.value);
                  if (!isNaN(score)) {
                    setScoreInput(score);
                  }
                }}
              />
            </div>
            <div className="flex-1">
              <p className="mb-1.5">Time</p>
              <Input value={currentTime.toFixed(2)} readOnly />
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
            <Button className="w-full" onClick={submitManualShot}>
              Submit
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
};
