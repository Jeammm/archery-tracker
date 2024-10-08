import { DetailedShotData } from "@/components/stats/DetailedShotData";
import { GeneralData } from "@/components/stats/GeneralData";
import { SessionSummary } from "@/components/stats/SessionSummary";
import { SessionVideo } from "@/components/stats/SessionVideo";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { BASE_BACKEND_URL } from "@/services/baseUrl";
import { Session } from "@/types/session";
import axios from "axios";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

export const SessionDetail = () => {
  const { user } = useAuth();
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState<Session | null>(null);
  const [conditionMet, setConditionMet] = useState<boolean>(false);

  const fetchSessionData = async () => {
    try {
      const response = await axios.get(
        `${BASE_BACKEND_URL}/sessions/${sessionId}`,
        {
          headers: {
            Authorization: `Bearer ${user?.token || ""}`,
          },
        }
      );
      setSession(response.data);

      // Check your condition here
      const { target_status, pose_status } = response.data as Session;
      if (pose_status === "SUCCESS" && target_status === "SUCCESS") {
        setConditionMet(true);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchSessionData();

    const intervalId = setInterval(() => {
      if (!conditionMet) {
        fetchSessionData();
      } else {
        clearInterval(intervalId);
      }
    }, 5000);

    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conditionMet]);

  if (!session) {
    return (
      <div>
        <p>404 NOT FOUND</p>
      </div>
    );
  }

  if (session.pose_status === "LIVE" || session.target_status === "LIVE") {
    navigate(`/trainingSession/live/${session._id}`, { replace: true });
  }

  return (
    <div>
      <h1 className="text-4xl font-bold">Session Detail</h1>
      <p className="mt-2 text-muted-foreground">
        {format(new Date(session.created_at), "hh:mm a 'at' do MMMM yyyy")}
      </p>
      <Tabs defaultValue="general" className="mt-6">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="detail">Detail</TabsTrigger>
          <TabsTrigger value="video">Video</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
        </TabsList>
        <TabsContent value="general">
          <GeneralData sessionData={session} />
        </TabsContent>
        <TabsContent value="detail">
          <DetailedShotData sessionData={session} />
        </TabsContent>
        <TabsContent value="video">
          <SessionVideo sessionData={session} />
        </TabsContent>
        <TabsContent value="summary">
          <SessionSummary sessionData={session} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
