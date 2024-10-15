import { useEffect, useState, useRef, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { db } from "@/services/fireStore";
import {
  doc,
  setDoc,
  onSnapshot,
  collection,
  addDoc,
} from "firebase/firestore";
import { BASE_BACKEND_URL, BASE_FRONTEND_URL } from "@/services/baseUrl";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useAuth } from "@/context/AuthContext";
import { Round, Session } from "@/types/session";
import { Loader } from "@/components/ui/loader";
import axios from "axios";
import { useTimeElapsed } from "@/hooks/useTimeElapsed";
import { socket } from "@/services/socket";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

export const SessionInitiate = () => {
  const { sessionId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [peerConnection, setPeerConnection] =
    useState<RTCPeerConnection | null>(null);
  const [isCameraConnected, setIsCameraConnected] = useState<boolean>(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );
  const [recording, setRecording] = useState<boolean>(false);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [participantDevices, setParticipantDevices] = useState<{
    users: Record<string, string>;
  }>({ users: {} });
  const [roundData, setRoundData] = useState<Round | null>(null);
  const [targetVideoUploadingStatus, setTargetVideoUploadingStatus] = useState<
    Record<string, number>
  >({});
  const [uploadedRoundVideo, setUploadedRoundVideo] = useState<string[]>([]);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const { elapsedTime, timeReady } = useTimeElapsed({
    startDatetime: roundData?.created_at,
  });

  const fetchSessionData = useCallback(async () => {
    if (!sessionId || !user?.token) {
      return;
    }
    const response = await axios.get(
      `${BASE_BACKEND_URL}/sessions/${sessionId}`,
      {
        headers: {
          Authorization: `Bearer ${user?.token || ""}`,
        },
      }
    );

    setSession(response.data);
  }, [sessionId, user?.token]);

  const onClickEndSession = async () => {
    try {
      await axios.post(
        `${BASE_BACKEND_URL}/end-sessions/${sessionId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${user?.token || ""}`,
          },
        }
      );
      socket.emit("sessionEnd", { sessionId });
      navigate(`/sessions/${sessionId}`);
    } catch (error) {
      console.error("Error ending session:", error);
    }
  };

  const sendVideoProcessRequest = async (roundId: string) => {
    try {
      await axios.post(
        `${BASE_BACKEND_URL}/process-target/${roundId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${user?.token || ""}`,
          },
        }
      );
    } catch (error) {
      console.error("Error processing videos:", error);
    }
  };

  const startRecording = () => {
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

      recorder.start();
      setMediaRecorder(recorder);
      setRecording(true);

      // Emit start recording event
      socket.emit("recordingStarted", { sessionId });
    }
  };

  const stopRecording = async () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setRecording(false);

      // Emit stop recording event
      socket.emit("recordingStopped", { sessionId });
    }
  };

  useEffect(() => {
    fetchSessionData();
  }, [fetchSessionData]);

  useEffect(() => {
    const uploadVideoBlob = async () => {
      // Upload video
      if (videoBlob) {
        const formData = new FormData();
        formData.append("video", videoBlob, `session_${sessionId}.webm`);

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
      }
    };
    uploadVideoBlob();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoBlob]);

  useEffect(() => {
    const init = async () => {
      if (!sessionId) {
        return;
      }
      // Set up local video
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Set up WebRTC
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });
      setPeerConnection(pc);

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      // Listen for remote connection
      const sessionDoc = doc(db, "sessions", sessionId);
      onSnapshot(sessionDoc, async (snapshot) => {
        const data = snapshot.data();
        if (!pc.currentRemoteDescription && data && data.answer) {
          const remoteDesc = new RTCSessionDescription(data.answer);
          await pc.setRemoteDescription(remoteDesc);
          setIsCameraConnected(true);
        }
      });

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          addDoc(
            collection(db, "sessions", sessionId, "callerCandidates"),
            event.candidate.toJSON()
          );
        }
      };

      // Create offer
      const offerDescription = await pc.createOffer();
      await pc.setLocalDescription(offerDescription);

      const offer = {
        sdp: offerDescription.sdp,
        type: offerDescription.type,
      };

      await setDoc(sessionDoc, { offer });

      // Listen for remote ICE candidates
      onSnapshot(
        collection(db, "sessions", sessionId, "calleeCandidates"),
        (snapshot) => {
          snapshot.docChanges().forEach(async (change) => {
            if (change.type === "added") {
              const data = change.doc.data();
              await pc.addIceCandidate(new RTCIceCandidate(data));
            }
          });
        }
      );

      ///////
    };

    socket.emit("startSession", { sessionId });
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
      }
    );
    socket.on(
      "targetVideoUploadProgress",
      (data: { uploading_status: Record<string, number> }) => {
        setTargetVideoUploadingStatus(data.uploading_status);
      }
    );
    init();

    // Cleanup function
    return () => {
      if (peerConnection) {
        peerConnection.close();
      }
      socket.emit("sessionEnd", { sessionId });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  useEffect(() => {
    Object.keys(targetVideoUploadingStatus).map(async (roundId) => {
      if (
        !uploadedRoundVideo.includes(roundId) &&
        targetVideoUploadingStatus[roundId] === 100
      ) {
        console.log("hrere");
        setUploadedRoundVideo((prev) => [...prev, roundId]);
        await sendVideoProcessRequest(roundId);
        await fetchSessionData();
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetVideoUploadingStatus, uploadedRoundVideo]);

  if (!session) {
    return <Loader />;
  }

  const RoundDetails = ({ className }: { className?: string }) => {
    return (
      <div className={cn(["border rounded-md flex flex-col", className])}>
        <div className="border-b p-2">
          <h3 className="font-bold">Rounds Detail</h3>
        </div>

        <div className="p-2 flex flex-col gap-2">
          {!recording && isCameraConnected && (
            <Button
              onClick={startRecording}
              disabled={recording}
              className="bg-green-200 hover:bg-green-100 flex gap-2 w-full h-14"
            >
              <Plus
                strokeWidth={3}
                className="text-inherit rounded-full p-2"
                size={32}
              />
              <p>Start New Round</p>
            </Button>
          )}

          {recording && isCameraConnected && (
            <Button
              onClick={stopRecording}
              disabled={!recording}
              variant="secondary"
              className="bg-red-500 text-white hover:bg-red-400 h-14"
            >
              <div>
                <div>
                  {timeReady ? (
                    <p>Elapsed Time : {elapsedTime}</p>
                  ) : (
                    <Loader containerClassName="w-fit">Loading...</Loader>
                  )}
                </div>
                <p className="font-bold">End This Round</p>
              </div>
            </Button>
          )}

          {Object.keys(targetVideoUploadingStatus)
            .filter((round) => !uploadedRoundVideo.includes(round))
            .map((_, index) => {
              return (
                <div className="bg-slate-900 rounded-md p-2 border">
                  <p className="font-extrabold">
                    Round : {session.round_result.length + index + 1}
                  </p>
                  <div className="flex gap-1.5 items-center">
                    <p>Poseture Video : </p>
                    <Loader containerClassName="w-fit" spinnerSize="sm">
                      <p className="text-muted-foreground">Uploading...</p>
                    </Loader>
                  </div>
                  <div className="flex gap-1.5 items-center">
                    <p>Target Video : </p>
                    <Loader containerClassName="w-fit" spinnerSize="sm">
                      <p className="text-muted-foreground">Uploading...</p>
                    </Loader>
                  </div>
                </div>
              );
            })
            .reverse()}
          <div className="flex flex-col gap-2">
            {session.round_result
              .map((round, index) => {
                return (
                  <div className="bg-slate-900 rounded-md p-2 border">
                    <p className="font-extrabold">Round : {index + 1}</p>
                    <div className="flex gap-1.5 items-center">
                      <p>Poseture Video : </p>
                      {round.pose_status !== "SUCCESS" ? (
                        <Loader containerClassName="w-fit" spinnerSize="sm">
                          <p className="text-muted-foreground">Processing...</p>
                        </Loader>
                      ) : (
                        <p className="text-muted-foreground">Success</p>
                      )}
                    </div>
                    <div className="flex gap-1.5 items-center">
                      <p>Target Video : </p>
                      {round.target_status !== "SUCCESS" ? (
                        <Loader containerClassName="w-fit" spinnerSize="sm">
                          <p className="text-muted-foreground">Processing...</p>
                        </Loader>
                      ) : (
                        <p className="text-muted-foreground">Success</p>
                      )}
                    </div>
                  </div>
                );
              })
              .reverse()}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="flex justify-between">
        <div>
          <h1 className="text-4xl font-bold">Start Training!</h1>
          <p className="mt-2 text-muted-foreground">
            Start time:{" "}
            {format(session.created_at, "hh:mm a 'at' do MMMM yyyy")}
          </p>
        </div>
        <Button onClick={onClickEndSession} variant="destructive">
          End Session
        </Button>
      </div>

      <div
        className={cn(["flex gap-4 mt-6", isCameraConnected ? "relative" : ""])}
      >
        {isCameraConnected && <RoundDetails className="w-[300px]" />}
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
              isCameraConnected
                ? "absolute opacity-0 group-hover/posture-feed:opacity-100 transition-all"
                : "w-full text-center font-bold text-2xl tracking-widest",
            ])}
          >
            Posture
          </h4>
          <div className="w-full aspect-[4/3]">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full"
            />
          </div>
        </div>
        <div className="flex-1 border rounded-md overflow-hidden">
          <h4 className="w-full text-center font-bold text-2xl tracking-widest">
            Target
          </h4>
          <div className="w-full aspect-[4/3] relative">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full"
            />
            {sessionId && !isCameraConnected && (
              <>
                <div className="absolute z-20 top-0 left-0 w-full h-full flex justify-center items-center flex-col">
                  <Skeleton className="absolute w-full h-full" />
                </div>
                <div className="absolute z-30 top-0 left-0 w-full h-full flex justify-center items-center flex-col">
                  <QRCodeSVG
                    value={`${BASE_FRONTEND_URL}/join?session=${sessionId}`}
                  />
                  <p className="text-lg mt-3">
                    Scan with mobile phone to use as target camera
                  </p>

                  <Link to={`${BASE_FRONTEND_URL}/join?session=${sessionId}`}>
                    <Button variant="outline" className="mt-2">
                      JOIN
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div>
          {Object.entries(participantDevices.users)
            .filter(([key]) => key !== "is_recording")
            .map(([key, value]) => (
              <div className="flex text-sm text-muted-foreground items-center gap-1">
                <p key={key}>{value}:</p>
                <div className="flex bg-secondary  px-1 gap-1 rounded-sm items-center">
                  <div className="w-1 h-1 rounded-full bg-green-500" />
                  <p className="text-secondary-foreground text-xs">online</p>
                </div>
                <p>({key})</p>
              </div>
            ))}
        </div>
      </div>
      <div className="mt-6">{!isCameraConnected && <RoundDetails />}</div>
    </div>
  );
};
