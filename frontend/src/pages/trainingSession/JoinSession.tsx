import { useEffect, useRef, useState } from "react";
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

export const JoinSession = () => {
  const [peerConnection, setPeerConnection] =
    useState<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const location = useLocation();

  useEffect(() => {
    const init = async () => {
      const sessionId = new URLSearchParams(location.search).get("session");
      if (!sessionId) {
        console.error("No session ID provided");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
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

    return () => {
      if (peerConnection) {
        peerConnection.close();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  return (
    <div>
      <video ref={localVideoRef} autoPlay playsInline muted />
    </div>
  );
};
