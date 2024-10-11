import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/services/fireStore";
import { socket } from "@/services/socket";
import axios from "axios";
import { BASE_BACKEND_URL } from "@/services/baseUrl";
import { QuestionMarkCircledIcon } from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";

export const JoinSession = () => {
  const navigate = useNavigate();
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [peerConnection, setPeerConnection] =
    useState<RTCPeerConnection | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isSessionEnded, setIsSessionEnded] = useState<boolean>(false);
  const [participantDevices, setParticipantDevices] = useState<{
    users: Record<string, string>;
  }>({ users: {} });

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const location = useLocation();
  const sessionId = new URLSearchParams(location.search).get("session");

  // Start recording the media stream
  const startRecording = () => {
    if (localVideoRef.current && !isRecording) {
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
      setIsRecording(true);
    }
  };

  // Stop recording and handle the video blob
  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      if (!sessionId) {
        console.error("No session ID provided");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        setVideoStream(stream);
      }

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });
      setPeerConnection(pc);

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          addDoc(
            collection(db, "sessions", sessionId, "calleeCandidates"),
            event.candidate.toJSON()
          );
        }
      };

      // Get the offer from Firestore
      const sessionDoc = await getDoc(doc(db, "sessions", sessionId));
      const sessionData = sessionDoc.data();
      if (sessionData && sessionData.offer) {
        await pc.setRemoteDescription(
          new RTCSessionDescription(sessionData.offer)
        );
        const answerDescription = await pc.createAnswer();
        await pc.setLocalDescription(answerDescription);

        const answer = {
          type: answerDescription.type,
          sdp: answerDescription.sdp,
        };

        await updateDoc(doc(db, "sessions", sessionId), { answer });
      }

      // Listen for remote ICE candidates
      const callerCandidatesRef = collection(
        db,
        "sessions",
        sessionId,
        "callerCandidates"
      );
      onSnapshot(callerCandidatesRef, (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          if (change.type === "added") {
            const data = change.doc.data();
            await pc.addIceCandidate(new RTCIceCandidate(data));
          }
        });
      });
    };

    // Listen for WebSocket events to start and stop recording
    socket.on("recordingStarted", () => {
      startRecording();
    });

    socket.on("recordingStopped", () => {
      stopRecording();
    });
    socket.on("session_ended", () => {
      setIsSessionEnded(true);
    });
    socket.on("participant_join", (data: { users: Record<string, string> }) => {
      setParticipantDevices(data);
    });

    socket.emit("joinSession", { sessionId });

    init();

    return () => {
      if (peerConnection) {
        peerConnection.close();
        socket.emit("leaveSession", { sessionId });
      }
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  useEffect(() => {
    const uploadVideoBlob = async () => {
      // Upload video
      if (videoBlob) {
        const formData = new FormData();
        formData.append("video", videoBlob, `session_${sessionId}.webm`);

        await axios.post(
          `${BASE_BACKEND_URL}/upload-target-video/${sessionId}`,
          formData,
          {
            headers: {
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
    if (isSessionEnded && videoStream) {
      videoStream.getTracks().forEach((track) => {
        track.stop();
      });
    }
  }, [isSessionEnded, videoStream]);

  if (isSessionEnded) {
    return (
      <div className="flex flex-col justify-center items-center w-full h-[100svh] bg-grid-pattern">
        <div className="fixed top-0 border-b w-full p-2 justify-between flex items-center backdrop-blur-sm">
          <Link to="/">
            <h3 className="font-bold text-xl">Archery Tracker</h3>
          </Link>
          <QuestionMarkCircledIcon />
        </div>

        <p className="text-4xl font-bold">Training Session Ended</p>
        <p className="mt-5">
          You can see your training performance after the video processing
          completed
        </p>
        <div className="flex gap-1 items-center">
          <p className="text-muted-foreground text-xm">
            If you think the session is not ended yet and this is a mistake, you
            can
          </p>
          <Button
            variant="link"
            onClick={() => {
              navigate(0);
            }}
            className="px-0 text-muted-foreground"
          >
            try reconnecting.
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center md:flex-row flex-col h-[100svh] gap-2 bg-grid-pattern">
      <div className="md:hidden border-b w-full p-2 justify-between flex items-center backdrop-blur-sm">
        <h3 className="font-bold text-xl">Archery Tracker</h3>
        <QuestionMarkCircledIcon />
      </div>
      <div className="md:hidden flex gap-2 items-center bg-secondary text-secondary-foreground py-2 rounded-md w-full justify-center">
        <div className="w-2 h-2 rounded-full bg-green-500" />
        <h2 className="text-center font-bold">Target Camera : Online</h2>
      </div>
      <div className="border mx-4 rounded-xl flex-1 overflow-hidden object-fill">
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="h-full w-full object-cover"
        />
      </div>
      <div>
        <div className="hidden md:flex w-full p-2 justify-between  items-center backdrop-blur-sm">
          <h3 className="font-bold text-xl">Archery Tracker</h3>
          <QuestionMarkCircledIcon />
        </div>
        <div className="hidden md:flex gap-2 items-center bg-secondary text-secondary-foreground py-2 rounded-md w-full justify-center">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <h2 className="text-center font-bold">Target Camera : Online</h2>
        </div>
        <div className="flex flex-col gap-1 mb-2 md:mt-4">
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
    </div>
  );
};
