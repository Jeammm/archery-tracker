import { useRef, useEffect, useState } from "react";
import { BodyFeatures, initailBodyFeatures, Skeleton } from "@/types/skeleton";
import { socket } from "@/services/socket";
import { drawStickFigure } from "@/utils/canvasHelper";
import { stopCamera } from "@/utils/camera";
import { Button } from "@/components/ui/button";

const BUFFER_DURATION = 5000; // 5 seconds in milliseconds

const VideoCapture: React.FC = () => {
  const videoRef1 = useRef<HTMLVideoElement>(null);
  const videoWrapperRef = useRef<HTMLDivElement>(null);
  const skeletonCanvas = useRef<HTMLCanvasElement>(null); // Canvas for skeleton overlay
  const [skeleton, setSkeleton] = useState<Skeleton>([]);
  const [bodyFeatures, setBodyFeatures] =
    useState<BodyFeatures>(initailBodyFeatures);
  const [phase, setPhase] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [bufferedChunks, setBufferedChunks] = useState<Blob[]>([]);

  useEffect(() => {
    const setupVideo = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        setStream(mediaStream);

        const recorder = new MediaRecorder(mediaStream);
        recorder.ondataavailable = handleDataAvailable;
        setMediaRecorder(recorder);
        recorder.start(1000); // Capture data every second
      } catch (err) {
        console.error("Error accessing media devices.", err);
      }
    };

    setupVideo();

    socket.on("skeleton_data", (data: Skeleton) => {
      setSkeleton(data);
    });

    socket.on("phase_data", (data: string) => {
      setPhase(data);
      if (data === "start") {
        startRecording();
      } else if (data === "end") {
        stopRecording();
      }
    });

    socket.on("body_feature_data", (data: BodyFeatures) => {
      setBodyFeatures(data);
    });

    return () => {
      stopCamera(stream);
      setStream(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDataAvailable = (event: BlobEvent) => {
    if (event.data.size > 0) {
      setBufferedChunks((prev) => {
        const newChunks = [...prev, event.data];
        const maxBufferedChunks = BUFFER_DURATION / 1000; // Assuming 1 second chunks
        return newChunks.slice(-maxBufferedChunks);
      });
    }
  };

  const startRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== "recording") {
      setRecordedChunks([...bufferedChunks]); // Start with buffered data
      mediaRecorder.start(1000); // Start capturing data every second
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      mediaRecorder.onstop = async () => {
        const blob = new Blob(recordedChunks, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        console.log("Video URL:", url);
        await uploadVideo(blob);
      };
    }
  };

  useEffect(() => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      const handleDataAvailableWhileRecording = (event: BlobEvent) => {
        if (event.data.size > 0) {
          setRecordedChunks((prev) => [...prev, event.data]);
        }
      };
      mediaRecorder.ondataavailable = handleDataAvailableWhileRecording;
    }
  }, [mediaRecorder]);

  const uploadVideo = async (blob: Blob) => {
    const formData = new FormData();
    formData.append("video", blob, "recording.webm");

    const backendUrl = import.meta.env.VITE_BACKEND_URL; // Get backend URL from environment variable
    const uploadUrl = `${backendUrl}/video`; // Construct the full URL for the upload endpoint

    try {
      const response = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        console.log("Video uploaded successfully.");
      } else {
        console.error("Failed to upload video.");
      }
    } catch (err) {
      console.error("Error uploading video:", err);
    }
  };

  useEffect(() => {
    if (!videoRef1.current || !stream) {
      return;
    }
    videoRef1.current.srcObject = stream;

    videoRef1.current.addEventListener("play", () => {
      const sendFrame1 = () => {
        const temp = document.createElement("canvas");
        const videoDataPlaceHolder = temp.getContext("2d");

        if (
          !videoRef1.current ||
          videoRef1.current.paused ||
          videoRef1.current.ended ||
          !videoDataPlaceHolder
        ) {
          return;
        }

        videoDataPlaceHolder.drawImage(
          videoRef1.current,
          0,
          0,
          videoDataPlaceHolder.canvas.width,
          videoDataPlaceHolder.canvas.height
        );
        const data = temp.toDataURL("image/jpeg");
        socket.emit("video_frame_pose", data);

        requestAnimationFrame(sendFrame1);
      };

      sendFrame1();
    });
  }, [stream]);

  useEffect(() => {
    if (!skeletonCanvas.current) {
      return;
    }

    const skeletonOverlay = skeletonCanvas.current.getContext("2d");

    if (!skeletonOverlay || !videoRef1.current || !videoWrapperRef.current) {
      return;
    }

    drawStickFigure(skeletonCanvas.current, skeleton);
  }, [skeleton]);

  return (
    <div>
      <div>
        <h2>Pose Estimation</h2>
        <div className="size-96">
          <div className="relative flex -scale-x-[1]" ref={videoWrapperRef}>
            <video
              ref={videoRef1}
              autoPlay
              className="border border-red-500 w-full h-full"
            />
            <canvas
              ref={skeletonCanvas}
              className="absolute w-full h-full z-1 border border-green-500"
            />
          </div>
        </div>
        <p>{phase}</p>
        {JSON.stringify(bodyFeatures, null, 2)}
        <div>
          <Button onClick={startRecording}>Start</Button>
          <Button onClick={stopRecording}>Stop</Button>
        </div>
      </div>
    </div>
  );
};

export default VideoCapture;
