import { useEffect, useState, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Link, useParams } from "react-router-dom";
import { db } from "@/services/fireStore";
import {
  doc,
  setDoc,
  onSnapshot,
  collection,
  addDoc,
} from "firebase/firestore";
import { BASE_FRONTEND_URL } from "@/services/baseUrl";

export const SessionInitiate = () => {
  const { sessionId } = useParams();
  const [peerConnection, setPeerConnection] =
    useState<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

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

    init();

    // Cleanup function
    return () => {
      if (peerConnection) {
        peerConnection.close();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  return (
    <div>
      <video ref={localVideoRef} autoPlay playsInline muted />
      <video ref={remoteVideoRef} autoPlay playsInline />
      {sessionId && (
        <>
          <QRCodeSVG value={`${BASE_FRONTEND_URL}/join?session=${sessionId}`} />
        </>
      )}
      <Link to={`${BASE_FRONTEND_URL}/join?session=${sessionId}`}>Join</Link>
    </div>
  );
};
