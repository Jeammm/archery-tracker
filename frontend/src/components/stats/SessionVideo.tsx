import { ByteArkPlayerContainer } from "byteark-player-react";
import type {
  ByteArkPlayer,
  ByteArkPlayerContainerProps,
} from "byteark-player-react";
import { ArrowBigLeft, Play, Pause, ArrowBigRight, Pencil } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Slider } from "@/components/ui/slider";
import { formatSecondsToMMSS } from "@/utils/dateTime";
import { Hit, Session } from "@/types/session";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Skeleton } from "../ui/skeleton";
import { Loader } from "../ui/loader";
import { ProcessingFailed } from "./RetryButton";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Input } from "../ui/input";
import DEFAULT_IMAGE from "/placeholder-image.jpg";
import axios from "axios";
import { BASE_BACKEND_URL } from "@/services/baseUrl";
import { useAuth } from "@/context/AuthContext";
import { isNil } from "lodash";
import { onImageError } from "@/utils/canvasHelper";
import { toast } from "@/hooks/use-toast";
import { SetStateActionType } from "@/types/constant";
interface SessionVideoProps {
  sessionData: Session;
  selectedRound: number;
  fetchSessionData: () => void;
}

const FPS = 30;

export const SessionVideo = (props: SessionVideoProps) => {
  const { sessionData, selectedRound, fetchSessionData } = props;

  const { round_result } = sessionData;

  const {
    target_video,
    pose_video,
    score,
    target_status,
    pose_status,
    _id: roundId,
  } = round_result[selectedRound];

  const [targetPlayerInstance, setTargetPlayerInstance] =
    useState<ByteArkPlayer | null>(null);
  const [posePlayerInstance, setPosePlayerInstance] =
    useState<ByteArkPlayer | null>(null);

  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [currentShot, setCurrentShot] = useState<number>(0);
  const [targetImage, setTargetImage] = useState<string | null>(null);
  const [poseImage, setPoseImage] = useState<string | null>(null);

  const [isEditShotModalOpen, setIsEditShotModalOpen] =
    useState<boolean>(false);
  const [currentEditableShot, setCurrentEditableShot] = useState<Hit | null>(
    null
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const targetPlayerOptions: ByteArkPlayerContainerProps = {
    autoplay: false,
    fill: true,
    aspectRatio: "16:9",
    controls: false,
    sources: [
      {
        src: target_video?.[0].playbackUrls[0].hls[0].url || "",
        type: "application/x-mpegURL",
        title: "Target Video",
        videoId: "TargetVideoId",
      },
    ],
  };

  const posePlayerOptions: ByteArkPlayerContainerProps = {
    autoplay: false,
    fill: true,
    aspectRatio: "16:9",
    controls: false,
    sources: [
      {
        src: pose_video?.[0].playbackUrls[0].hls[0].url || "",
        type: "application/x-mpegURL",
        title: "Pose Video",
        videoId: "PoseVideoId",
      },
    ],
  };

  const onTargetVideoReady = (newPlayerInstance: ByteArkPlayer) => {
    setTargetPlayerInstance(newPlayerInstance);
    newPlayerInstance.on("timeupdate", () => {
      const newTime = newPlayerInstance.currentTime();
      const newFrame = Math.floor(newTime * FPS);
      setCurrentTime(newTime);
      updateCurrentShot(newFrame);
    });
  };

  const onPoseVideoReady = (newPlayerInstance: ByteArkPlayer) => {
    setPosePlayerInstance(newPlayerInstance);
  };

  useEffect(() => {
    if (targetPlayerInstance && posePlayerInstance) {
      targetPlayerInstance.on("play", () => {
        setIsVideoPlaying(true);
        posePlayerInstance.play();
      });
      targetPlayerInstance.on("pause", () => {
        setIsVideoPlaying(false);
        posePlayerInstance.pause();
      });
    }
  }, [targetPlayerInstance, posePlayerInstance]);

  useEffect(() => {
    if (currentShot && itemRefs.current[currentShot]) {
      itemRefs.current[currentShot]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [currentShot]);

  const getFrameFromShotNumber = (shotNo: number) => {
    return score?.find((hit) => hit.id === shotNo)?.frame || 0;
  };

  const onClickPause = () => {
    targetPlayerInstance?.pause();
    posePlayerInstance?.pause();
  };

  const onClickPlay = () => {
    targetPlayerInstance?.play();
    posePlayerInstance?.play();
  };

  const onClickPrevious = () => {
    seekToFrame(getFrameFromShotNumber(currentShot - 1));
  };

  const onClickNext = () => {
    seekToFrame(getFrameFromShotNumber(currentShot + 1));
  };

  const onPlayerClick = () => {
    if (isVideoPlaying) {
      targetPlayerInstance?.pause();
      posePlayerInstance?.pause();
    } else {
      targetPlayerInstance?.play();
      posePlayerInstance?.play();
    }
  };

  const handleSliderChange = (value: number[]) => {
    const newTime = value[0];
    targetPlayerInstance?.currentTime(newTime);
    posePlayerInstance?.currentTime(newTime);
    setCurrentTime(newTime);

    if (isVideoPlaying) {
      targetPlayerInstance?.play();
      posePlayerInstance?.play();
    }
  };

  const seekToFrame = (frameNumber: number) => {
    const newTime = frameNumber / FPS + 1;
    targetPlayerInstance?.currentTime(newTime);
    posePlayerInstance?.currentTime(newTime);
    setCurrentTime(newTime);

    if (isVideoPlaying) {
      targetPlayerInstance?.play();
      posePlayerInstance?.play();
    }
  };

  const updateCurrentShot = (frame: number) => {
    const currentShot = score?.find((shot, index) => {
      const nextShot = score[index + 1];
      return shot.frame <= frame && (!nextShot || nextShot.frame > frame);
    });
    setCurrentShot(currentShot ? Number(currentShot.id) : 0);
  };

  const captureVideos = () => {
    if (!posePlayerInstance || !targetPlayerInstance) {
      return;
    }
    const poseVideoPlayer = document
      .getElementById(posePlayerInstance.id())
      ?.getElementsByTagName("video")[0];
    const targetVideoPlayer = document
      .getElementById(targetPlayerInstance.id())
      ?.getElementsByTagName("video")[0];

    if (!poseVideoPlayer || !targetVideoPlayer) {
      return;
    }

    const poseCanvas = document.createElement("canvas");
    const targetCanvas = document.createElement("canvas");

    poseCanvas.width = posePlayerInstance.videoWidth();
    poseCanvas.height = posePlayerInstance.videoHeight();

    targetCanvas.width = targetPlayerInstance.videoWidth();
    targetCanvas.height = targetPlayerInstance.videoHeight();

    const poseCanvasContext = poseCanvas.getContext("2d");
    poseCanvasContext?.drawImage(poseVideoPlayer, 0, 0);
    setPoseImage(poseCanvas.toDataURL("image/png"));

    const targetCanvasContext = targetCanvas.getContext("2d");
    targetCanvasContext?.drawImage(targetVideoPlayer, 0, 0);
    setTargetImage(targetCanvas.toDataURL("image/png"));
  };

  const onClickEditShotModal = (hit: Hit) => {
    setCurrentEditableShot(hit);
    console.log(hit.frame);
    seekToFrame(hit.frame);
    setCurrentTime(hit.frame / 30);
    setIsEditShotModalOpen(true);
  };

  const isVideoNotReady =
    pose_status !== "SUCCESS" && target_status !== "SUCCESS";

  if (target_status === "FAILURE" || pose_status === "FAILURE") {
    return <ProcessingFailed round={round_result[selectedRound]} />;
  }

  return (
    <div className="mt-1 md:mt-6 flex-1 flex flex-col">
      <EditShotModal
        isEditShotModalOpen={isEditShotModalOpen}
        setIsEditShotModalOpen={setIsEditShotModalOpen}
        captureVideos={captureVideos}
        hit={currentEditableShot}
        roundId={roundId}
        poseImage={poseImage}
        targetImage={targetImage}
        fetchSessionData={fetchSessionData}
        currentTime={currentTime}
        seekToFrame={seekToFrame}
      />
      <div
        className="flex flex-col sm:flex-row"
        onClick={onPlayerClick}
        onTouchEnd={onPlayerClick}
      >
        <div className="flex-1 h-auto aspect-video overflow-hidden">
          {!isVideoNotReady ? (
            <ByteArkPlayerContainer
              {...posePlayerOptions}
              onReady={onPoseVideoReady}
            />
          ) : (
            <div className="relative w-full h-full">
              <Skeleton className="w-full h-full" />
              <Loader containerClassName="absolute w-full h-full top-0">
                Processing...
              </Loader>
            </div>
          )}
        </div>
        <div className="flex-1 h-auto aspect-video overflow-hidden">
          {!isVideoNotReady ? (
            <ByteArkPlayerContainer
              {...targetPlayerOptions}
              onReady={onTargetVideoReady}
            />
          ) : (
            <div className="relative w-full h-full">
              <Skeleton className="w-full h-full" />
              <Loader containerClassName="absolute w-full h-full top-0">
                Processing...
              </Loader>
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-2 mt-2 border rounded-sm p-2">
        <div className="flex gap-1  shrink-0 items-center">
          <Button
            onClick={onClickPrevious}
            variant="clean"
            size="no-space"
            disabled={isVideoNotReady || currentShot <= 1}
          >
            <ArrowBigLeft className="fill-foreground" />
          </Button>
          {isVideoPlaying ? (
            <Button
              onClick={onClickPause}
              variant="clean"
              size="no-space"
              disabled={isVideoNotReady}
            >
              <Pause className="fill-foreground" size={20} />
            </Button>
          ) : (
            <Button
              onClick={onClickPlay}
              variant="clean"
              size="no-space"
              disabled={isVideoNotReady}
            >
              <Play size={20} className="fill-foreground" />
            </Button>
          )}
          <Button
            onClick={onClickNext}
            variant="clean"
            size="no-space"
            disabled={isVideoNotReady || currentShot === score?.length}
          >
            <ArrowBigRight className="fill-foreground" />
          </Button>

          {isVideoNotReady ? (
            <p className="text-sm tracking-tighter text-muted-foreground">
              processing
            </p>
          ) : (
            <div className="flex gap-0.5 text-xs tracking-tighter mx-1">
              <span>{`${formatSecondsToMMSS(currentTime)}`}</span>
              <span className="hidden md:block">
                {targetPlayerInstance?.duration()
                  ? `/ ${formatSecondsToMMSS(targetPlayerInstance?.duration())}`
                  : ""}
              </span>
            </div>
          )}
        </div>
        <Slider
          value={[currentTime]}
          max={targetPlayerInstance?.duration()}
          step={1}
          onValueChange={(value) => handleSliderChange(value)}
          disabled={isVideoNotReady}
        />
        <AddMissingShotModal
          currentTime={currentTime}
          onClick={() => {
            onClickPause();
            captureVideos();
          }}
          targetImage={targetImage}
          poseImage={poseImage}
          roundId={roundId}
          fetchSessionData={fetchSessionData}
          className="hidden md:block"
        />
      </div>
      <div className="rounded-md mt-4 overflow-hidden border flex-1 flex flex-col">
        <div className="flex items-center justify-between px-3 py-1 md:p-3 bg-primary ">
          <h2 className="text-primary-foreground font-semibold">Shots</h2>
          <AddMissingShotModal
            currentTime={currentTime}
            onClick={() => {
              onClickPause();
              captureVideos();
            }}
            targetImage={targetImage}
            poseImage={poseImage}
            roundId={roundId}
            fetchSessionData={fetchSessionData}
            className="block md:hidden"
          />
        </div>
        <Separator />
        <div className="grid grid-cols-5 border-b items-center cursor-pointer bg-secondary text-secondary-foreground px-4 py-1.5">
          <p>No.</p>
          <p>Frame</p>
          <p>Score</p>
          <p>Location</p>
          <p></p>
        </div>
        <div
          className="h-[200px] grow overflow-scroll flex flex-col"
          ref={containerRef}
        >
          {!isVideoNotReady ? (
            score?.map((hit) => (
              <div
                ref={(el) => (itemRefs.current[hit.id] = el)}
                className={cn([
                  "grid grid-cols-5 border-b items-center cursor-pointer hover:bg-accent text-accent-foreground px-4 py-1",
                  currentShot === Number(hit.id) &&
                    "bg-primary/70 hover:bg-primary/80 text-primary-foreground",
                ])}
                key={`${hit.id}-${hit.frame}`}
              >
                <p>{hit.id}</p>
                <p>{hit.frame}</p>
                <p>{hit.score}</p>
                <div className="leading-tight">
                  <p>x : {hit.point[0]}</p>
                  <p>y : {hit.point[1]}</p>
                </div>
                <div className="flex gap-2 ml-auto items-center">
                  <Button
                    onClick={() => onClickEditShotModal(hit)}
                    size="icon"
                    variant="ghost"
                  >
                    <Pencil size={18} />
                  </Button>
                  <Button
                    onClick={() => seekToFrame(hit.frame)}
                    size="icon"
                    variant="ghost"
                  >
                    <Play size={18} />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="w-full h-full relative">
              <Skeleton className="w-full h-full" />
              <Loader containerClassName="absolute w-full h-full top-0">
                Processing...
              </Loader>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const AddMissingShotModal = ({
  currentTime,
  onClick,
  targetImage,
  poseImage,
  roundId,
  fetchSessionData,
  className,
}: {
  currentTime: number;
  onClick: () => void;
  targetImage: string | null;
  poseImage: string | null;
  roundId: string;
  fetchSessionData: () => void;
  className?: string;
}) => {
  const [scoreInput, setScoreInput] = useState<number | null>(null);
  const [hitLocation, setHitLocation] = useState<{
    x: number | null;
    y: number | null;
  }>({ x: null, y: null });

  const { user } = useAuth();

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

  return (
    <Dialog>
      <DialogTrigger>
        <Button variant="outline" onClick={onClick} className={className}>
          Add Missing Shot
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Add missing shot</DialogTitle>
          <DialogDescription>
            Shot Missing? Don't worry, you can add a new shot manually.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2">
          <div className="flex-1 rounded-md border overflow-hidden">
            <img
              src={poseImage || DEFAULT_IMAGE}
              alt="current pose"
              className="w-full h-full object-cover"
              onError={onImageError}
            />
          </div>
          <div className="flex-1 rounded-md border overflow-hidden">
            <img
              src={targetImage || DEFAULT_IMAGE}
              alt="current target"
              className="w-full h-full object-cover"
              onError={onImageError}
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
          <DialogClose className="w-full mt-4">
            <Button className="w-full" onClick={submitManualShot}>
              Submit
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const EditShotModal = ({
  hit,
  setIsEditShotModalOpen,
  isEditShotModalOpen,
  roundId,
  poseImage,
  targetImage,
  seekToFrame,
  fetchSessionData,
  captureVideos,
}: {
  isEditShotModalOpen: boolean;
  setIsEditShotModalOpen: SetStateActionType<boolean>;
  hit: Hit | null;
  roundId: string;
  poseImage: string | null;
  targetImage: string | null;
  fetchSessionData: () => void;
  currentTime: number;
  seekToFrame: (frameNumber: number) => void;
  captureVideos: () => void;
}) => {
  const { user } = useAuth();

  const [isNewFrameLoading, setIsNewFrameLoading] = useState<boolean>(false);

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
    setIsNewFrameLoading(true);
    captureVideos();
    setIsNewFrameLoading(false);
  }, [captureVideos, currentFrame]);

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
            {!isNewFrameLoading ? (
              <img
                src={poseImage || DEFAULT_IMAGE}
                alt="current pose"
                className="w-full h-full object-cover"
                onError={onImageError}
              />
            ) : (
              <Loader />
            )}
          </div>
          <div className="flex-1 rounded-md border overflow-hidden">
            {!isNewFrameLoading ? (
              <img
                src={targetImage || DEFAULT_IMAGE}
                alt="current target"
                className="w-full h-full object-cover"
                onError={onImageError}
              />
            ) : (
              <Loader />
            )}
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
          <DialogClose className="w-full mt-4">
            <Button className="w-full" onClick={submitShotDataChange}>
              Submit
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
};
