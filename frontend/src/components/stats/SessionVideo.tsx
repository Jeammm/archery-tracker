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
import { AddMissingShotModal } from "../modal/AddMissingShotModal";
import { EditShotModal } from "../modal/EditShotModal";
import { FPS } from "@/types/constant";
import { formatTTS } from "@/utils/formatScore";
interface SessionVideoProps {
  sessionData: Session;
  selectedRound: number;
  fetchSessionData: () => void;
}

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

  const poseCanvasEditModal = useRef<HTMLCanvasElement>(null);
  const targetCanvasEditModal = useRef<HTMLCanvasElement>(null);
  const poseCanvasAddModal = useRef<HTMLCanvasElement>(null);
  const targetCanvasAddModal = useRef<HTMLCanvasElement>(null);

  const [isEditShotModalOpen, setIsEditShotModalOpen] =
    useState<boolean>(false);
  const [currentEditableShot, setCurrentEditableShot] = useState<Hit | null>(
    null
  );

  const [isAddShotModalOpen, setIsAddShotModalOpen] = useState<boolean>(false);

  const [isVideoEnded, setIsVideoEnded] = useState<boolean>(false);

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
      setIsVideoEnded(false);
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
      targetPlayerInstance.on("ended", () => {
        setIsVideoEnded(true);
      });
      posePlayerInstance.on("ended", () => {
        setIsVideoEnded(true);
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

  const onClickPrevious = () => {
    seekToFrame(getFrameFromShotNumber(currentShot - 1));
  };

  const onClickNext = () => {
    seekToFrame(getFrameFromShotNumber(currentShot + 1));
  };

  const pauseVideo = () => {
    targetPlayerInstance?.pause();
    posePlayerInstance?.pause();
  };

  const resumeVideo = () => {
    targetPlayerInstance?.play();
    posePlayerInstance?.play();
  };

  const onPlayerClick = () => {
    if (isVideoPlaying) {
      pauseVideo();
    } else if (!isVideoPlaying && isVideoEnded) {
      seekToFrame(0);
    } else {
      resumeVideo();
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
    const newTime = frameNumber / FPS;
    targetPlayerInstance?.currentTime(newTime);
    posePlayerInstance?.currentTime(newTime);
    setCurrentTime(newTime);
  };

  const updateCurrentShot = (frame: number) => {
    const currentShot = score?.find((shot, index) => {
      const nextShot = score[index + 1];
      return shot.frame <= frame && (!nextShot || nextShot.frame > frame);
    });
    setCurrentShot(currentShot ? Number(currentShot.id) : 0);
  };

  const drawOnCanvas = (
    canvas: React.RefObject<HTMLCanvasElement>,
    player: HTMLVideoElement
  ) => {
    if (!canvas.current) {
      return;
    }

    canvas.current.width = player.videoWidth;
    canvas.current.height = player.videoHeight;
    const canvasContext = canvas.current.getContext("2d");
    canvasContext?.drawImage(player, 0, 0);
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

    drawOnCanvas(poseCanvasAddModal, poseVideoPlayer);
    drawOnCanvas(targetCanvasAddModal, targetVideoPlayer);
    drawOnCanvas(poseCanvasEditModal, poseVideoPlayer);
    drawOnCanvas(targetCanvasEditModal, targetVideoPlayer);
  };

  const onClickEditShotModal = (hit: Hit) => {
    pauseVideo();
    setCurrentEditableShot(hit);
    seekToFrame(hit.frame);
    setCurrentTime(hit.frame / 30);
    setIsEditShotModalOpen(true);
  };

  const onClickAddShotModal = () => {
    pauseVideo();
    setIsAddShotModalOpen(true);
  };

  const isVideoNotReady =
    pose_status !== "SUCCESS" && target_status !== "SUCCESS";

  if (target_status === "FAILURE" || pose_status === "FAILURE") {
    return (
      <ProcessingFailed round={round_result[selectedRound]} refreshAfterRetry />
    );
  }

  return (
    <div className="mt-1 md:mt-6 flex-1 flex flex-col">
      <EditShotModal
        isEditShotModalOpen={isEditShotModalOpen}
        setIsEditShotModalOpen={setIsEditShotModalOpen}
        captureVideos={captureVideos}
        hit={currentEditableShot}
        roundId={roundId}
        poseCanvasRef={poseCanvasEditModal}
        targetCanvasRef={targetCanvasEditModal}
        fetchSessionData={fetchSessionData}
        currentTime={currentTime}
        seekToFrame={seekToFrame}
      />
      <AddMissingShotModal
        currentTime={currentTime}
        isAddShotModalOpen={isAddShotModalOpen}
        setIsAddShotModalOpen={setIsAddShotModalOpen}
        captureVideos={captureVideos}
        poseCanvasRef={poseCanvasAddModal}
        targetCanvasRef={targetCanvasAddModal}
        roundId={roundId}
        fetchSessionData={fetchSessionData}
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
              onClick={onPlayerClick}
              variant="clean"
              size="no-space"
              disabled={isVideoNotReady}
            >
              <Pause className="fill-foreground" size={20} />
            </Button>
          ) : (
            <Button
              onClick={onPlayerClick}
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
          step={0.1}
          onValueChange={(value) => handleSliderChange(value)}
          disabled={isVideoNotReady}
        />
        <Button
          variant="outline"
          onClick={onClickAddShotModal}
          className="hidden md:block"
        >
          Add Missing Shot
        </Button>
      </div>
      <div className="rounded-md mt-4 overflow-hidden border flex-1 flex flex-col">
        <div className="flex items-center justify-between px-3 py-1 md:p-3 bg-primary ">
          <h2 className="text-primary-foreground font-semibold">Shots</h2>
          <Button
            variant="outline"
            onClick={onClickAddShotModal}
            className="block md:hidden"
          >
            Add Missing Shot
          </Button>
        </div>
        <Separator />
        <div className="grid grid-cols-6 border-b items-center cursor-pointer bg-secondary text-secondary-foreground px-4 py-1.5">
          <p>No.</p>
          <p>Frame</p>
          <p>Score</p>
          <p>Location</p>
          <p>TTS</p>
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
                  "grid grid-cols-6 border-b items-center cursor-pointer hover:bg-accent text-accent-foreground px-4 py-1",
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
                <p>{formatTTS(hit.tts)}</p>
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
