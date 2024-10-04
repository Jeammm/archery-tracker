import { MediaVideo } from "@/types/video";
import { ByteArkPlayerContainer } from "byteark-player-react";
import type {
  ByteArkPlayer,
  ByteArkPlayerContainerProps,
} from "byteark-player-react";
import { ArrowBigLeft, Play, Pause, ArrowBigRight } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Slider } from "@/components/ui/slider";
import { formatSecondsToMMSS } from "@/utils/dateTime";
import { Hit } from "@/types/session";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface SessionVideoProps {
  targetVideo: MediaVideo[];
  poseVideo: MediaVideo[];
  scoreDetail: Hit[];
}

const FPS = 24;

export const SessionVideo = (props: SessionVideoProps) => {
  const { targetVideo, poseVideo, scoreDetail } = props;

  const [targetPlayerInstance, setTargetPlayerInstance] =
    useState<ByteArkPlayer | null>(null);
  const [posePlayerInstance, setPosePlayerInstance] =
    useState<ByteArkPlayer | null>(null);

  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [currentShot, setCurrentShot] = useState<number>(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const targetPlayerOptions: ByteArkPlayerContainerProps = {
    autoplay: false,
    fill: true,
    aspectRatio: "16:9",
    controls: false,
    sources: [
      {
        src: targetVideo[0].playbackUrls[0].hls[0].url,
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
        src: poseVideo[0].playbackUrls[0].hls[0].url,
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

  const onClickPause = () => {
    targetPlayerInstance?.pause();
    posePlayerInstance?.pause();
  };

  const onClickPlay = () => {
    targetPlayerInstance?.play();
    posePlayerInstance?.play();
  };

  const onClickPrevious = () => {
    seekToFrame(scoreDetail[0].frame);
  };

  const onClickNext = () => {
    // Implement next functionality
  };

  const handleSliderChange = (value: number[]) => {
    const newTime = value[0];
    targetPlayerInstance?.currentTime(newTime);
    posePlayerInstance?.currentTime(newTime);
    setCurrentTime(newTime);
  };

  const seekToFrame = (frameNumber: number) => {
    const newTime = frameNumber / FPS + 1;
    targetPlayerInstance?.currentTime(newTime);
    posePlayerInstance?.currentTime(newTime);
    setCurrentTime(newTime);
  };

  const updateCurrentShot = (frame: number) => {
    const currentShot = scoreDetail.find((shot, index) => {
      const nextShot = scoreDetail[index + 1];
      return shot.frame <= frame && (!nextShot || nextShot.frame > frame);
    });
    setCurrentShot(currentShot ? Number(currentShot.id) : 0);
  };

  return (
    <div>
      <div className="flex gap-3">
        <div className="flex-1 h-auto aspect-video rounded-md overflow-hidden">
          <ByteArkPlayerContainer
            {...targetPlayerOptions}
            onReady={onTargetVideoReady}
          />
        </div>
        <div className="flex-1 h-auto aspect-video rounded-md overflow-hidden">
          <ByteArkPlayerContainer
            {...posePlayerOptions}
            onReady={onPoseVideoReady}
          />
        </div>
      </div>
      <div className="flex gap-2 mt-2">
        <div className="flex gap-1  shrink-0 items-center">
          <ArrowBigLeft fill="white" onClick={onClickPrevious} />
          {isVideoPlaying ? (
            <Pause fill="white" onClick={onClickPause} />
          ) : (
            <Play fill="white" onClick={onClickPlay} />
          )}
          <ArrowBigRight fill="white" onClick={onClickNext} />
          <p className="text-sm tracking-tighter">
            {`${formatSecondsToMMSS(currentTime)} / ${formatSecondsToMMSS(
              targetPlayerInstance?.duration() || 0
            )}`}
          </p>
        </div>
        <Slider
          value={[currentTime]}
          max={targetPlayerInstance?.duration()}
          step={1}
          onValueChange={(value) => handleSliderChange(value)}
        />
      </div>
      <div className="rounded-md mt-4 overflow-hidden border">
        <h2 className="p-3 bg-slate-900">Shots</h2>
        <Separator />
        <div className="h-[200px] overflow-scroll" ref={containerRef}>
          {scoreDetail.map((hit) => (
            <div
              ref={(el) => (itemRefs.current[hit.id] = el)}
              className={cn([
                "grid grid-cols-5 border-b items-center cursor-pointer hover:bg-slate-900 px-4",
                currentShot === Number(hit.id) &&
                  "bg-slate-700 hover:bg-slate-800",
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
          ))}
        </div>
      </div>
    </div>
  );
};
