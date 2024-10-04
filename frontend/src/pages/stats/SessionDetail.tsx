import { DetailedShotData } from "@/components/stats/DetailedShotData";
import { GeneralData } from "@/components/stats/GeneralData";
import { SessionSummary } from "@/components/stats/SessionSummary";
import { SessionVideo } from "@/components/stats/SessionVideo";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { BASE_BACKEND_URL } from "@/services/baseUrl";
import { Session } from "@/types/session";
import { format } from "date-fns";
import useFetch from "react-fetch-hook";
import { useNavigate, useParams } from "react-router-dom";

export const SessionDetail = () => {
  const { user } = useAuth();
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const {
    data,
    // isLoading,
    error,
  } = useFetch(`${BASE_BACKEND_URL}/sessions/${sessionId}`, {
    headers: {
      Authorization: `Bearer ${user?.token || ""}`,
    },
  });

  const session = data as Session | undefined;

  if (error || !session) {
    return (
      <div>
        <p>{JSON.stringify(error)}</p>
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
