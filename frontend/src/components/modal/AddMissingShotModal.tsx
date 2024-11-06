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
import { ShotLocationCanvasOverlay } from "./ShotLocationCanvasOverlay";

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

export interface HitLocation {
  x: number;
  y: number;
}

const initialHitLocation = { x: 960, y: 540 };

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
  const [hitLocation, setHitLocation] = useState<HitLocation>({ x: 0, y: 0 });

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
      setHitLocation(initialHitLocation);
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
        setHitLocation(initialHitLocation);
      }, 0);
    } else {
      setHitLocation({ x: 0, y: 0 });
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
        <div className="flex gap-2 flex-col xs:flex-row">
          <div className="flex-1 rounded-md border overflow-hidden">
            <canvas
              ref={poseCanvasRef}
              className="w-full h-full aspect-video"
            />
          </div>
          <div className="flex-1 rounded-md border overflow-hidden relative">
            <canvas
              ref={targetCanvasRef}
              className="w-full h-full aspect-video"
            />
            <ShotLocationCanvasOverlay
              hitLocation={hitLocation}
              setHitLocation={setHitLocation}
            />
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex gap-2 flex-col sm:flex-row">
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
              <p className="mb-1.5">Hit Time</p>
              <Input value={currentTime.toFixed(2)} readOnly />
            </div>
          </div>
          <div>
            <p>Location</p>
            <div className="flex w-full gap-2 mt-2">
              <div className="flex gap-1 whitespace-nowrap items-center flex-1">
                <p>x : </p>
                <Input
                  className="flex-1"
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
              <div className="flex gap-1 whitespace-nowrap items-center flex-1">
                <p>y : </p>
                <Input
                  className="flex-1"
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
