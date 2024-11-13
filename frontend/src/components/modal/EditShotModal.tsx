import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";
import { BASE_BACKEND_URL } from "@/services/baseUrl";
import { SetStateActionType, XYRelation } from "@/types/constant";
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
import { ShotLocationCanvasOverlay } from "./ShotLocationCanvasOverlay";

const initialHitLocation = { x: 960, y: 540 };

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
  const [hitLocation, setHitLocation] = useState<XYRelation>({ x: 0, y: 0 });

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
      setHitLocation(initialHitLocation);
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
    } else {
      setHitLocation(initialHitLocation);
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
        <div>
          <div className="flex gap-2 w-full mb-4 flex-col sm:flex-row">
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
              <div className="flex items-center gap-2">
                <Button onClick={onClickPreviousFrame} variant="outline">
                  <ArrowBigLeft />
                </Button>
                <Input value={String(currentFrame?.toFixed(2))} readOnly />
                <Button onClick={onClickNextFrame} variant="outline">
                  <ArrowBigRight />
                </Button>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <p>Location</p>
            <div className="flex gap-2 mt-2 w-full">
              <div className="flex gap-1 whitespace-nowrap items-center flex-1">
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
              <div className="flex gap-1 whitespace-nowrap items-center flex-1">
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
