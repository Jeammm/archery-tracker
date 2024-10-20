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
  getDocs,
  deleteDoc,
  Firestore,
} from "firebase/firestore";
import { BASE_BACKEND_URL, BASE_FRONTEND_URL } from "@/services/baseUrl";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useAuth } from "@/context/AuthContext";
import { Round, Session } from "@/types/session";
import { Loader } from "@/components/ui/loader";
import axios from "axios";
import { socket } from "@/services/socket";
import { cn } from "@/lib/utils";
import { Play, Square } from "lucide-react";
import { RoundDetailsTable } from "./RoundDetailsTable";

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

  const [isTestMode, setIsTestMode] = useState<boolean>(true);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

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
        `${BASE_BACKEND_URL}/${
          isTestMode ? "process-target-test" : "process-target"
        }/${roundId}`,
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
      if (videoBlob && roundData) {
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
        setRoundData(null);
      }
    };
    uploadVideoBlob();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoBlob, roundData]);

  const clearCandidates = async (db: Firestore, sessionId: string) => {
    const callerCandidatesRef = collection(
      db,
      "sessions",
      sessionId,
      "callerCandidates"
    );
    const calleeCandidatesRef = collection(
      db,
      "sessions",
      sessionId,
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
    await clearCandidates(db, sessionId);
    pc.onicecandidate = async (event) => {
      if (!event.candidate) {
        return;
      }
      addDoc(
        collection(db, "sessions", sessionId, "callerCandidates"),
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
    return stream;
    ///////
  };

  useEffect(() => {
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
        setIsCameraConnected(false);
        init();
      }
    );
    socket.on(
      "targetVideoUploadProgress",
      (data: { uploading_status: Record<string, number> }) => {
        setTargetVideoUploadingStatus(data.uploading_status);
      }
    );
    const stream = init();

    // Cleanup function
    return () => {
      if (peerConnection) {
        peerConnection.close();
      }
      if (stream) {
        stream.then((streamTrack) =>
          streamTrack?.getTracks().forEach((track) => {
            if (track.readyState === "live") {
              track.stop();
            }
          })
        );
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

  if (session.session_status === "ENDED") {
    return (
      <div className="w-full h-full flex flex-col justify-center items-center gap-3">
        <h2 className="text-4xl font-bold">This Session is ended</h2>
        <p>
          You can start new training session or visit this session's result.
        </p>
        <div className="flex gap-2">
          <Link
            className={buttonVariants({ variant: "default" })}
            to="/trainingSession"
          >
            Start New Training Session
          </Link>
          <Link
            className={buttonVariants({ variant: "outline" })}
            to={`/sessions/${sessionId}`}
          >
            View Session Result
          </Link>
        </div>
      </div>
    );
  }

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
        <div className="flex gap-2">
          <Link
            to={`/sessions/${sessionId}`}
            className={buttonVariants({
              variant: "default",
            })}
          >
            Session Details
          </Link>
          <Button onClick={onClickEndSession} variant="destructive">
            End Session
          </Button>
        </div>
      </div>

      <div
        className={cn(["flex gap-4 mt-6", isCameraConnected ? "relative" : ""])}
      >
        {isCameraConnected && (
          <div className="w-[300px] grid grid-rows-[auto,1fr]">
            <div className="mb-2 flex gap-2">
              <Button
                onClick={startRecording}
                disabled={recording}
                className="bg-green-500 hover:bg-green-400 h-8 flex-1 gap-1.5"
              >
                <Play fill="white" color="white" size={18} />
                <p className="font-bold text-white">Start</p>
              </Button>

              <Button
                onClick={stopRecording}
                disabled={!recording}
                variant="secondary"
                className="bg-red-500 hover:bg-red-400 h-8 flex-1 gap-1.5"
              >
                <Square fill="white" color="white" size={18} />
                <p className="font-bold text-white">End</p>
              </Button>

              <div className="flex gap-1 border p-1 rounded-md">
                <input
                  type="checkbox"
                  defaultChecked={isTestMode}
                  onChange={() => setIsTestMode(!isTestMode)}
                />
                <p>Test Mode</p>
              </div>
            </div>

            <RoundDetailsTable
              targetVideoUploadingStatus={targetVideoUploadingStatus}
              session={session}
              roundData={roundData}
              uploadedRoundVideo={uploadedRoundVideo}
              isCameraConnected
            />
          </div>
        )}
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
              "w-full",
              isCameraConnected
                ? "absolute opacity-0 group-hover/posture-feed:opacity-100 transition-all py-1 px-2 bg-black/30 backdrop-blur-sm"
                : "text-center font-bold text-2xl tracking-widest",
            ])}
          >
            Posture
          </h4>
          <div className="w-full aspect-[4/3] relative">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
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
              "w-full",
              isCameraConnected
                ? "absolute opacity-0 group-hover/target-feed:opacity-100 transition-all z-10 py-1 px-2 bg-black/30 backdrop-blur-sm"
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
            {sessionId && !isCameraConnected && (
              <>
                <div className="absolute z-20 top-0 left-0 w-full h-full flex justify-center items-center flex-col">
                  <Skeleton className="absolute w-full h-full" />
                </div>
                <div className="absolute z-30 top-0 left-0 w-full h-full flex justify-center items-center flex-col">
                  <div className="bg-white p-1 border relative">
                    <QRCodeSVG
                      value={`${BASE_FRONTEND_URL}/join?session=${sessionId}`}
                    />
                  </div>
                  <p className="text-lg mt-3 text-center w-full font-semibold">
                    Scan with mobile phone <br />
                    to use as target camera
                  </p>

                  <div
                    onClick={() => {
                      window.open(
                        `${BASE_FRONTEND_URL}/join?session=${sessionId}`,
                        "newwindow",
                        "width=800,height=400"
                      );
                      return false;
                    }}
                  >
                    <Button variant="outline" className="mt-2">
                      JOIN
                    </Button>
                  </div>
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
              <div
                className="flex text-sm text-muted-foreground items-center gap-1"
                key={key}
              >
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
      <div className="mt-6">
        {!isCameraConnected && (
          <RoundDetailsTable
            targetVideoUploadingStatus={targetVideoUploadingStatus}
            session={session}
            roundData={roundData}
            uploadedRoundVideo={uploadedRoundVideo}
            containerClassName="min-h-[150px]"
          />
        )}
      </div>
    </div>
  );
};
