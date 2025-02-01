import { useCallback, useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Keypoint, PoseDetector } from "@tensorflow-models/pose-detection";
import * as poseDetection from "@tensorflow-models/pose-detection";
import * as tf from "@tensorflow/tfjs";
import axios from "axios";
import { Play, Square } from "lucide-react";
import { db } from "@/services/fireStore";
import {
  doc,
  setDoc,
  onSnapshot,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  Firestore,
} from "firebase/firestore";

import { BASE_BACKEND_URL, BASE_FRONTEND_URL } from "@/services/baseUrl";
import { socket } from "@/services/socket";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { Round, Session } from "@/types/session";
import { SetStateActionType } from "@/types/constant";
import { RoundDetailsTable } from "@/components/rounds/RoundDetailsTable";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader } from "@/components/ui/loader";
import { CountDownOverlay } from "../countdown/CountDownOverlay";
import { VideoOverlayCanvas } from "./VideoOverlayCanvas";
import { toast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface SessionInitiateVideoStreamProps {
  session: Session;
  recording: boolean;
  roundData: Round | null;
  mode: string;
  isCameraConnected: boolean;
  participantDevices: { users: Record<string, string> };
  targetVideoUploadingStatus: Record<string, number>;
  setRoundData: SetStateActionType<Round | null>;
  setRecording: SetStateActionType<boolean>;
  setMode: SetStateActionType<string>;
  setIsCameraConnected: SetStateActionType<boolean>;
  setParticipantDevices: SetStateActionType<{ users: Record<string, string> }>;
  setTargetVideoUploadingStatus: SetStateActionType<Record<string, number>>;

  setUploadedTargetVideos: SetStateActionType<string[]>;
  setUploadedPoseVideos: SetStateActionType<string[]>;
}

const THRESHOLD = 0.6;

export const SessionInitiateVideoStream = (
  props: SessionInitiateVideoStreamProps
) => {
  const { user } = useAuth();

  const {
    session,
    isCameraConnected,
    setIsCameraConnected,
    recording,
    setRecording,
    mode,
    setMode,
    roundData,
    setRoundData,
    targetVideoUploadingStatus,
    setTargetVideoUploadingStatus,
    setParticipantDevices,
    setUploadedTargetVideos,
    setUploadedPoseVideos,
  } = props;

  const [keypoints, setKeypoints] = useState<Keypoint[]>([]);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [isEndTriggered, setIsEndTriggered] = useState<boolean>(false);
  const [recordingTimestamp, setRecordingTimestamp] = useState<number>(0);
  const [isRecordingTriggered, setIsRecordingTriggered] =
    useState<boolean>(false);
  const [peerConnection, setPeerConnection] =
    useState<RTCPeerConnection | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );

  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [disconnectDetectedSignal, setDisconnectDetectedSignal] =
    useState<number>(0);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const poseDetectorRef = useRef<PoseDetector | null>(null);

  const loadPoseDetector = async () => {
    await tf.setBackend("webgl");
    const detector = await poseDetection.createDetector(
      poseDetection.SupportedModels.MoveNet
    );
    poseDetectorRef.current = detector;
  };

  async function detectPose() {
    if (!poseDetectorRef.current || !localVideoRef.current) {
      return requestAnimationFrame(detectPose);
    }

    const poses = await poseDetectorRef.current.estimatePoses(
      localVideoRef.current
    );

    // Check if hand is raised above head
    if (poses?.[0] && poses?.[0].keypoints) {
      const pose = poses[0];
      const leftWrist = pose.keypoints.find((k) => k.name === "left_wrist");
      const rightWrist = pose.keypoints.find((k) => k.name === "right_wrist");
      const nose = pose.keypoints.find((k) => k.name === "nose");

      if (leftWrist && rightWrist && nose && !recording) {
        setKeypoints([leftWrist, rightWrist]);

        const isLeftHandOverHead = isHandOverhead(leftWrist, nose);
        const isRightHandOverHead = isHandOverhead(rightWrist, nose);

        if (isRightHandOverHead) {
          triggerStartRecording();
        } else if (isLeftHandOverHead) {
          triggerEndRecording(); // disable to prevent wrong stop trigger
        }
      }
    }

    requestAnimationFrame(detectPose);
  }

  function isHandOverhead(wrist: Keypoint, head: Keypoint) {
    return (
      (wrist.score || 0) > THRESHOLD &&
      (head.score || 0) > THRESHOLD &&
      wrist.y < head.y
    ); // Hand is above head if wrist is higher than the head
  }

  function triggerStartRecording() {
    setIsEndTriggered(false);
    setIsRecordingTriggered(true);
  }

  function triggerEndRecording() {
    setIsEndTriggered(true);
    setIsRecordingTriggered(false);
  }

  const startRecording = useCallback(() => {
    if (localVideoRef.current) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      recorder.onstop = () => {
        const videoBlob = new Blob(chunks, { type: "video/webm" });
        setVideoBlob(videoBlob);
      };

      recorder.onstart = () => {
        setRecordingTimestamp(Date.now());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setRecording(true);

      // Emit start recording event
      socket.emit("recordingStarted", { sessionId: session._id });
      toast({
        title: "Round Start!",
        description: "Round has been started, Do your best!",
        variant: "warning",
      });
    }
  }, [session._id, setRecording]);

  const stopRecording = useCallback(async () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecordingTriggered(false);
      setIsEndTriggered(false);
      setRecording(false);
      // Emit stop recording event
      socket.emit("recordingStopped", { sessionId: session._id });
      toast({
        title: "Round Success!",
        description:
          "Your recording has been saved! The round result will be ready shortly",
        variant: "success",
      });
    }
  }, [mediaRecorder, session._id, setRecording]);

  useEffect(() => {
    const uploadVideoBlob = async () => {
      // Upload video
      if (videoBlob && roundData && isCameraConnected) {
        const formData = new FormData();
        formData.append("video", videoBlob, `session_${session._id}.webm`);
        formData.append("recording_start_timestamp", `${recordingTimestamp}`);

        await axios.post(
          `${BASE_BACKEND_URL}/upload-pose-video/${roundData?._id}`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${user?.token || ""}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );
        setUploadedPoseVideos((prev) => [...prev, roundData?._id]);
        setRoundData(null);
        setVideoBlob(null);
      }
    };
    uploadVideoBlob();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoBlob, roundData, isCameraConnected]);

  const clearCandidates = async (db: Firestore) => {
    const callerCandidatesRef = collection(
      db,
      "sessions",
      session._id,
      "callerCandidates"
    );
    const calleeCandidatesRef = collection(
      db,
      "sessions",
      session._id,
      "calleeCandidates"
    );

    // Fetch all documents in the callerCandidates collection and delete them
    const callerSnapshot = await getDocs(callerCandidatesRef);
    callerSnapshot.forEach(async (doc) => {
      await deleteDoc(doc.ref);
    });

    // Fetch all documents in the calleeCandidates collection and delete them
    const calleeSnapshot = await getDocs(calleeCandidatesRef);
    calleeSnapshot.forEach(async (doc) => {
      await deleteDoc(doc.ref);
    });
  };

  const initVideoStream = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "environment",
        width: { ideal: 960 },
        height: { ideal: 720 },
        frameRate: { ideal: 30 },
      },
      audio: false,
    });

    // Set up local video

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }

    setVideoStream(stream);

    return stream;
  };

  const initWebRTC = async () => {
    if (!session._id || !videoStream) {
      return;
    }

    // Set up WebRTC
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });
    setPeerConnection(pc);

    videoStream.getTracks().forEach((track) => pc.addTrack(track, videoStream));

    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    // Listen for remote connection
    const sessionDoc = doc(db, "sessions", session._id);
    onSnapshot(sessionDoc, async (snapshot) => {
      const data = snapshot.data();
      if (!pc.currentRemoteDescription && data && data.answer) {
        const remoteDesc = new RTCSessionDescription(data.answer);
        try {
          await pc.setRemoteDescription(remoteDesc);
          setIsCameraConnected(true);
        } catch {
          return;
        }
      }
    });

    // Handle ICE candidates
    await clearCandidates(db);
    pc.onicecandidate = async (event) => {
      if (!event.candidate) {
        return;
      }
      addDoc(
        collection(db, "sessions", session._id, "callerCandidates"),
        event.candidate.toJSON()
      );
    };

    // Create offer
    const offerDescription = await pc.createOffer();
    await pc.setLocalDescription(offerDescription);

    const offer = {
      sdp: offerDescription.sdp,
      type: offerDescription.type,
    };

    await setDoc(sessionDoc, { offer });

    onSnapshot(
      collection(db, "sessions", session._id, "calleeCandidates"),
      (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          if (change.type === "added" && pc.connectionState !== "closed") {
            const data = change.doc.data();
            await pc.addIceCandidate(new RTCIceCandidate(data));
          }
        });
      }
    );
  };

  useEffect(() => {
    loadPoseDetector();
  }, []);

  useEffect(() => {
    socket.emit("startSession", { sessionId: session._id });
    socket.on("recordingStarted", (data: { round_data: Round }) => {
      setRoundData(data.round_data);
    });
    socket.on("participant_join", (data: { users: Record<string, string> }) => {
      setParticipantDevices(data);
    });
    socket.on(
      "participant_leave",
      (data: { users: Record<string, string> }) => {
        setParticipantDevices(data);
        setIsCameraConnected(false);
        mediaRecorder?.stop();
        setRecording(false);
        setDisconnectDetectedSignal((prev) => prev + 1);
      }
    );
    socket.on(
      "targetVideoUploadProgress",
      (data: { uploading_status: { roundId: string; progress: number } }) => {
        setTargetVideoUploadingStatus((prev) => ({
          ...prev,
          [data.uploading_status.roundId]: data.uploading_status.progress,
        }));
      }
    );
    socket.on("targetVideoUploadDone", (data: { round_id: string }) => {
      setUploadedTargetVideos((prev) => [...prev, data.round_id]);
    });
    const stream = initVideoStream();
    detectPose();

    // Cleanup function
    return () => {
      if (stream) {
        stream.then((streamTrack) =>
          streamTrack?.getTracks().forEach((track) => {
            if (track.readyState === "live") {
              track.stop();
            }
          })
        );
      }
      socket.emit("sessionEnd", { sessionId: session._id });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session._id]);

  useEffect(() => {
    initWebRTC();
    return () => {
      if (peerConnection) {
        peerConnection.close();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session._id, disconnectDetectedSignal, videoStream]);

  useEffect(() => {
    if (isRecordingTriggered && !isCameraConnected) {
      setIsRecordingTriggered(false);
    }

    if (isEndTriggered && isCameraConnected && recording) {
      stopRecording();
    }

    let timeout: NodeJS.Timeout;
    if (
      isRecordingTriggered &&
      isCameraConnected &&
      !recording &&
      !isEndTriggered
    ) {
      setIsEndTriggered(false);
      timeout = setTimeout(() => {
        startRecording();
      }, 5500);
    }

    return () => {
      clearTimeout(timeout);
    };
  }, [
    isCameraConnected,
    isRecordingTriggered,
    recording,
    startRecording,
    isEndTriggered,
    stopRecording,
  ]);

  return (
    <div className="flex gap-4 mt-6">
      {isRecordingTriggered &&
        !recording &&
        isCameraConnected &&
        !isEndTriggered && <CountDownOverlay />}

      <div className="flex gap-4 flex-1 relative">
        <div
          className={cn([
            "border rounded-md overflow-hidden",
            isCameraConnected
              ? "absolute bottom-3 right-3 z-10 w-36 bg-black group/posture-feed"
              : "flex-1",
          ])}
        >
          <h4
            className={cn([
              "w-full bg-primary text-primary-foreground",
              isCameraConnected
                ? "absolute opacity-0 group-hover/posture-feed:opacity-100 transition-all py-1 px-2 backdrop-blur-sm"
                : "text-center font-bold text-2xl tracking-widest",
            ])}
          >
            Posture
          </h4>
          <div className="w-full aspect-[4/3] relative">
            <VideoOverlayCanvas
              keypoints={keypoints}
              video={localVideoRef.current}
              threshold={THRESHOLD}
            />
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              width={480}
              height={480}
              className={cn([
                localVideoRef?.current?.srcObject ? "w-full h-full" : "hidden",
              ])}
            />
            {!localVideoRef?.current?.srcObject && (
              <div className="w-full h-full absolute flex justify-center items-center z-10 top-0 left-0">
                <Loader spinnerSize="lg">
                  <></>
                </Loader>
              </div>
            )}
          </div>
        </div>
        <div className="flex-1 border rounded-md overflow-hidden group/target-feed relative">
          <h4
            className={cn([
              "w-full bg-primary text-primary-foreground",
              isCameraConnected
                ? "absolute opacity-0 group-hover/target-feed:opacity-100 transition-all z-10 py-1 px-2 backdrop-blur-sm"
                : "text-center font-bold text-2xl tracking-widest",
            ])}
          >
            Target
          </h4>
          <div className="w-full aspect-[4/3] relative">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className={cn([isCameraConnected ? "w-full h-full" : "hidden"])}
            />
            {session._id && !isCameraConnected && (
              <>
                <div className="absolute z-20 top-0 left-0 w-full h-full flex justify-center items-center flex-col">
                  <Skeleton className="absolute w-full h-full" />
                </div>
                <div className="absolute z-30 top-0 left-0 w-full h-full flex justify-center items-center flex-col">
                  <div className="bg-white p-1 border relative">
                    {peerConnection ? (
                      <div
                        className="cursor-pointer"
                        onClick={() => {
                          window.open(
                            `${BASE_FRONTEND_URL}/join?session=${session._id}`,
                            "newwindow",
                            "width=800,height=400"
                          );
                          return false;
                        }}
                      >
                        <QRCodeSVG
                          value={`${BASE_FRONTEND_URL}/join?session=${session._id}`}
                        />
                      </div>
                    ) : (
                      <Loader
                        containerClassName="w-[138px] h-[138px] flex justify-center items-center"
                        spinnerSize="md"
                      >
                        <></>
                      </Loader>
                    )}
                  </div>
                  <p className="text-lg mt-3 text-center w-full font-semibold">
                    Scan with mobile phone <br />
                    to use as target camera
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {isCameraConnected && (
        <div className="w-[300px] grid grid-rows-[auto,1fr]">
          <div className="mb-2 flex gap-2">
            <Button
              onClick={triggerStartRecording}
              disabled={recording}
              className="bg-green-500 hover:bg-green-400 h-8 flex-1 gap-1.5"
            >
              <Play fill="white" color="white" size={18} />
              <p className="font-bold text-white">Start</p>
            </Button>

            <Button
              onClick={triggerEndRecording}
              disabled={!recording}
              variant="secondary"
              className="bg-red-500 hover:bg-red-400 h-8 flex-1 gap-1.5"
            >
              <Square fill="white" color="white" size={18} />
              <p className="font-bold text-white">End</p>
            </Button>

            <Select onValueChange={(mode) => setMode(mode)} value={mode}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">ใช้งานจริง</SelectItem>
                <SelectItem value="control">ทดสอบ</SelectItem>
                <SelectItem value="demo1">ตัวอย่าง 1</SelectItem>
                <SelectItem value="demo2">ตัวอย่าง 2</SelectItem>
                <SelectItem value="demo3">ตัวอย่าง 3</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <RoundDetailsTable
            targetVideoUploadingStatus={targetVideoUploadingStatus}
            session={session}
            roundData={roundData}
            isCameraConnected
            recording={recording}
          />
        </div>
      )}
    </div>
  );
};
