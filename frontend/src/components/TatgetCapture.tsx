import { useRef, useEffect, useState } from "react";
import { socket } from "@/services/socket";
import { stopCamera } from "@/utils/camera";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";

const BUFFER_DURATION = 5000; // 5 seconds in milliseconds

interface TargetScoringProps {
  isModelReady: boolean;
}

const TargetScoring = (props: TargetScoringProps) => {
  const { isModelReady } = props;

  const videoRef = useRef<HTMLVideoElement>(null);
  const videoWrapperRef = useRef<HTMLDivElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [bufferedChunks, setBufferedChunks] = useState<Blob[]>([]);
  const [scores, setScores] = useState<number[]>([]);
  const [positions] = useState<[number, number][]>([]);
  const [useImage, setUseImage] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);

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

    if (!useImage) {
      setupVideo();
    }

    socket.on("target_scores", (data) => {
      const { frame, verified_hits } = data;
      setProcessedImage(frame);
      setScores(verified_hits);
    });

    return () => {
      stopCamera(stream);
      setStream(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useImage]);

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
    if (!videoRef.current || !stream || useImage) {
      return;
    }
    videoRef.current.srcObject = stream;

    videoRef.current.addEventListener("play", () => {
      const sendFrame = () => {
        const temp = document.createElement("canvas");
        const videoDataPlaceHolder = temp.getContext("2d");

        if (
          !videoRef.current ||
          videoRef.current.paused ||
          videoRef.current.ended ||
          !videoDataPlaceHolder
        ) {
          return;
        }

        videoDataPlaceHolder.drawImage(
          videoRef.current,
          0,
          0,
          videoDataPlaceHolder.canvas.width,
          videoDataPlaceHolder.canvas.height
        );
        const data = temp.toDataURL("image/jpeg");
        socket.emit("video_frame_target", { frame: data });

        requestAnimationFrame(sendFrame);
      };

      if (isModelReady) {
        sendFrame();
      }
    });
  }, [stream, useImage, isModelReady]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (useImage && selectedImage && isModelReady) {
      interval = setInterval(() => {
        socket.emit("video_frame_target", {
          frame: selectedImage,
        });
        console.log("emitted");
      }, 100);
    }

    return () => {
      clearInterval(interval);
    };
  }, [selectedImage, useImage, isModelReady]);

  return (
    <div>
      {!isModelReady && <Loader size="fullScreen" />}
      <div>
        <h2>Target Scoring</h2>
        <div className="size-96">
          <div className="relative flex" ref={videoWrapperRef}>
            {!useImage ? (
              <video
                ref={videoRef}
                autoPlay
                className="border border-red-500 w-full h-full"
              />
            ) : (
              <img
                src={selectedImage || ""}
                alt="Selected"
                className="border border-red-500 w-full h-full"
              />
            )}
          </div>
        </div>
        <div>
          <Button onClick={() => setUseImage(!useImage)}>
            {useImage ? "Use Live Video" : "Upload Image"}
          </Button>
          {useImage && (
            <input type="file" accept="image/*" onChange={handleImageUpload} />
          )}
          <Button onClick={startRecording}>Start</Button>
          <Button onClick={stopRecording}>Stop</Button>
        </div>
        <p>Scores: {JSON.stringify(scores)}</p>
        <p>Positions: {JSON.stringify(positions)}</p>
        {processedImage && <img src={processedImage} />}
      </div>
    </div>
  );
};

export default TargetScoring;
