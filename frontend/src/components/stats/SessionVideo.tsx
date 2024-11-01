import { ByteArkPlayerContainer } from "byteark-player-react";
import type {
  ByteArkPlayer,
  ByteArkPlayerContainerProps,
} from "byteark-player-react";
import { ArrowBigLeft, Play, Pause, ArrowBigRight } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Slider } from "@/components/ui/slider";
import { formatSecondsToMMSS } from "@/utils/dateTime";
import { Session } from "@/types/session";
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

  const isVideoNotReady =
    pose_status !== "SUCCESS" && target_status !== "SUCCESS";

  if (target_status === "FAILURE" || pose_status === "FAILURE") {
    return <ProcessingFailed round={round_result[selectedRound]} />;
  }

  return (
    <div className="mt-6">
      <div className="flex gap-3" onClick={onPlayerClick}>
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
            <ArrowBigLeft fill="white" />
          </Button>
          {isVideoPlaying ? (
            <Button
              onClick={onClickPause}
              variant="clean"
              size="no-space"
              disabled={isVideoNotReady}
            >
              <Pause fill="white" size={20} />
            </Button>
          ) : (
            <Button
              onClick={onClickPlay}
              variant="clean"
              size="no-space"
              disabled={isVideoNotReady}
            >
              <Play fill="white" size={20} />
            </Button>
          )}
          <Button
            onClick={onClickNext}
            variant="clean"
            size="no-space"
            disabled={isVideoNotReady || currentShot === score?.length}
          >
            <ArrowBigRight fill="white" />
          </Button>

          {isVideoNotReady ? (
            <p className="text-sm tracking-tighter text-muted-foreground">
              processing
            </p>
          ) : (
            <p className="text-xs tracking-tighter mx-1">{`${formatSecondsToMMSS(
              currentTime
            )} ${
              targetPlayerInstance?.duration()
                ? `/ ${formatSecondsToMMSS(targetPlayerInstance?.duration())}`
                : ""
            }`}</p>
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
        />
      </div>
      <div className="rounded-md mt-4 overflow-hidden border">
        <h2 className="p-3 bg-primary text-primary-foreground font-semibold">
          Shots
        </h2>
        <Separator />
        <div className="grid grid-cols-5 border-b items-center cursor-pointer bg-secondary text-secondary-foreground px-4 py-1.5">
          <p>No.</p>
          <p>Frame</p>
          <p>Score</p>
          <p>Location</p>
          <p className="text-end">Skip to frame</p>
        </div>
        <div className="h-[200px] overflow-scroll" ref={containerRef}>
          {!isVideoNotReady ? (
            score?.map((hit) => (
              <div
                ref={(el) => (itemRefs.current[hit.id] = el)}
                className={cn([
                  "grid grid-cols-5 border-b items-center cursor-pointer hover:bg-accent text-accent-foreground px-4",
                  currentShot === Number(hit.id) &&
                    "bg-primary/70 hover:bg-primary/80 text-primary-foreground",
                ])}
                key={`${hit.id}-${hit.frame}`}
              >
                <p>{hit.id}</p>
                <p>{hit.frame}</p>
                <p>{hit.score}</p>
                <p>{`[ x: ${hit.point[0]}, y:${hit.point[1]} ]`}</p>
                <Button
                  onClick={() => seekToFrame(hit.frame)}
                  size="icon"
                  variant="ghost"
                  className="ml-auto"
                >
                  <Play />
                </Button>
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
}: {
  currentTime: number;
  onClick: () => void;
  targetImage: string | null;
  poseImage: string | null;
  roundId: string;
  fetchSessionData: () => void;
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
      fetchSessionData();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Dialog>
      <DialogTrigger>
        <Button variant="outline" onClick={onClick}>
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
            />
          </div>
          <div className="flex-1 rounded-md border overflow-hidden">
            <img
              src={targetImage || DEFAULT_IMAGE}
              alt="current target"
              className="w-full h-full object-cover"
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
          <DialogClose>
            <Button className="w-full mt-4" onClick={submitManualShot}>
              Submit
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
};
