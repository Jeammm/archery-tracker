import axios from "axios";
import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { BASE_BACKEND_URL } from "@/services/baseUrl";
import { useAuth } from "@/context/AuthContext";
import { Round, Session } from "@/types/session";
import { Loader } from "@/components/ui/loader";
import { buttonVariants } from "@/components/ui/button";
import { ParticipantsList } from "@/components/participants/ParticipantsList";
import { SessionInitiateHeader } from "@/components/canvas/SessionInitiateHeader";
import { SessionInitiateVideoStream } from "@/components/canvas/SessionInitiateVideoStream";
import { RoundDetailsTable } from "../../components/rounds/RoundDetailsTable";

export const SessionInitiate = () => {
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const { user } = useAuth();

  const [session, setSession] = useState<Session | null>(null);
  const [recording, setRecording] = useState<boolean>(false);
  const [roundData, setRoundData] = useState<Round | null>(null);
  const [isTestMode, setIsTestMode] = useState<boolean>(false);
  const [isCameraConnected, setIsCameraConnected] = useState<boolean>(false);
  const [uploadedRoundVideo, setUploadedRoundVideo] = useState<string[]>([]);
  const [participantDevices, setParticipantDevices] = useState<{
    users: Record<string, string>;
  }>({ users: {} });
  const [targetVideoUploadingStatus, setTargetVideoUploadingStatus] = useState<
    Record<string, number>
  >({});

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

  const onClickEndSession = async (roundExist: boolean) => {
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
      if (roundExist) {
        navigate(`/sessions/${sessionId}`);
      } else {
        navigate("/dashboard");
      }
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

  useEffect(() => {
    fetchSessionData();
  }, [fetchSessionData]);

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
      <SessionInitiateHeader
        session={session}
        targetVideoUploadingStatus={targetVideoUploadingStatus}
        roundData={roundData}
        onClickEndSession={onClickEndSession}
      />

      <SessionInitiateVideoStream
        session={session}
        isCameraConnected={isCameraConnected}
        setIsCameraConnected={setIsCameraConnected}
        recording={recording}
        setRecording={setRecording}
        participantDevices={participantDevices}
        setParticipantDevices={setParticipantDevices}
        isTestMode={isTestMode}
        setIsTestMode={setIsTestMode}
        roundData={roundData}
        setRoundData={setRoundData}
        setTargetVideoUploadingStatus={setTargetVideoUploadingStatus}
        targetVideoUploadingStatus={targetVideoUploadingStatus}
        uploadedRoundVideo={uploadedRoundVideo}
      />

      <div className="mt-6">
        <ParticipantsList participantDevices={participantDevices} />
      </div>
      <div className="mt-6">
        {!isCameraConnected && (
          <RoundDetailsTable
            targetVideoUploadingStatus={targetVideoUploadingStatus}
            session={session}
            roundData={roundData}
            uploadedRoundVideo={uploadedRoundVideo}
            containerClassName="min-h-[150px]"
            recording={recording}
          />
        )}
      </div>
    </div>
  );
};
