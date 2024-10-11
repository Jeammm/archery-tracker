import { useEffect, useState, useRef } from "react";
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
import useFetch from "react-fetch-hook";
import { useAuth } from "@/context/AuthContext";
import { Session } from "@/types/session";
import { Loader } from "@/components/ui/loader";
import axios from "axios";
import { useTimeElapsed } from "@/hooks/useTimeElapsed";
import { socket } from "@/services/socket";

export const SessionInitiate = () => {
  const { sessionId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
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

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const { data } = useFetch(`${BASE_BACKEND_URL}/sessions/${sessionId}`, {
    headers: {
      Authorization: `Bearer ${user?.token || ""}`,
    },
  });

  const session = data as Session | undefined;

  const { elapsedTime, timeReady } = useTimeElapsed({
    startDatetime: session?.created_at,
  });

  const onClickEndSession = async () => {
    try {
      await axios.post(
        `${BASE_BACKEND_URL}/process-target/${sessionId}`,
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
    const uploadVideoBlob = async () => {
      // Upload video
      if (videoBlob) {
        const formData = new FormData();
        formData.append("video", videoBlob, `session_${sessionId}.webm`);

        await axios.post(
          `${BASE_BACKEND_URL}/upload-pose-video/${sessionId}`,
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
    };

    socket.emit("startSession", { sessionId });
    socket.on("participant_join", (data: { users: Record<string, string> }) => {
      setParticipantDevices(data);
    });
    socket.on(
      "participant_leave",
      (data: { users: Record<string, string> }) => {
        setParticipantDevices(data);
      }
    );
    init();

    // Cleanup function
    return () => {
      if (peerConnection) {
        peerConnection.close();
        socket.emit("sessionEnd", { sessionId });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  if (!session) {
    return <Loader />;
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
        <Button onClick={onClickEndSession} variant="destructive">
          End Session
        </Button>
      </div>
      <div className="flex gap-4 mt-6">
        <div className="flex-1 border rounded-md overflow-hidden">
          <h4 className="w-full text-center font-bold text-2xl tracking-widest">
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
        {timeReady ? (
          <p className="text-4xl font-bold">Elapsed Time : {elapsedTime}</p>
        ) : (
          <Loader containerClassName="w-fit">Loading...</Loader>
        )}
      </div>

      <div className="mt-4">
        <Button onClick={startRecording} disabled={recording}>
          Start Recording
        </Button>
        <Button
          onClick={stopRecording}
          disabled={!recording}
          variant="secondary"
        >
          Stop Recording
        </Button>
      </div>

      <div>
        {Object.entries(participantDevices.users).map(([key, value]) => (
          <p key={key}>
            {key}: {value} online
          </p>
        ))}
      </div>
    </div>
  );
};
