import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
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

export const JoinSession = () => {
  const [peerConnection, setPeerConnection] =
    useState<RTCPeerConnection | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const location = useLocation();
  const sessionId = new URLSearchParams(location.search).get("session");

  // Start recording the media stream
  const startRecording = useCallback(() => {
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
  }, [isRecording]);

  // Stop recording and handle the video blob
  const stopRecording = useCallback(() => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  }, [mediaRecorder]);

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

    init();

    // Listen for WebSocket events to start and stop recording
    socket.on("recordingStarted", () => {
      console.log("Recording started from laptop");
      startRecording();
    });

    socket.on("recordingStopped", () => {
      console.log("Recording stopped from laptop");
      stopRecording();
    });

    return () => {
      if (peerConnection) {
        peerConnection.close();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, startRecording, stopRecording]);

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

  return (
    <div>
      <video ref={localVideoRef} autoPlay playsInline muted />
    </div>
  );
};
