import { DetailedShotData } from "@/components/stats/DetailedShotData";
import { GeneralData } from "@/components/stats/GeneralData";
import { SessionSummary } from "@/components/stats/SessionSummary";
import { SessionVideo } from "@/components/stats/SessionVideo";
import { buttonVariants } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { BASE_BACKEND_URL } from "@/services/baseUrl";
import { Session } from "@/types/session";
import axios from "axios";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

export const SessionDetail = () => {
  const { user } = useAuth();
  const { sessionId } = useParams();

  const [session, setSession] = useState<Session | null>(null);
  const [conditionMet, setConditionMet] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentTab, setCurrentTab] = useState<string>("general");
  const [selectedRound, setSelectedRound] = useState<number>(0);

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
      const { processing_status } = response.data as Session;
      if (processing_status === "SUCCESS") {
        setConditionMet(true);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setIsLoading(false);
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
    if (isLoading) {
      return <Loader />;
    }
    return (
      <div>
        <p>404 NOT FOUND</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between">
        <div>
          <h1 className="text-4xl font-bold">Session Detail</h1>
          <p className="mt-2 text-muted-foreground">
            {format(new Date(session.created_at), "hh:mm a 'at' do MMMM yyyy")}
          </p>
        </div>
        {session.session_status === "STARTED" && (
          <Link
            to={`/trainingSession/live/${sessionId}`}
            className={buttonVariants({
              variant: "default",
              className: "flex gap-1.5",
            })}
          >
            <div className="w-2 h-2 rounded-full bg-green-500" />
            Continue This Session
          </Link>
        )}
      </div>

      <Tabs
        value={currentTab}
        onValueChange={(value) => setCurrentTab(value)}
        className="mt-6"
      >
        <div className="flex justify-between">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="detail">Detail</TabsTrigger>
            <TabsTrigger value="video">Video</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
          </TabsList>

          {currentTab === "video" && (
            <Select onValueChange={(value) => setSelectedRound(Number(value))}>
              <SelectTrigger className="w-[180px]">
                Round {selectedRound + 1}
              </SelectTrigger>
              <SelectContent>
                {session.round_result.map((_, index) => {
                  return (
                    <SelectItem value={`${index}`}>
                      Round {index + 1}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          )}
        </div>
        <TabsContent value="general">
          <GeneralData sessionData={session} />
        </TabsContent>
        <TabsContent value="detail">
          <DetailedShotData sessionData={session} />
        </TabsContent>
        <TabsContent value="video">
          <SessionVideo
            sessionData={session}
            selectedRound={selectedRound}
            key={`round-${selectedRound}`}
          />
        </TabsContent>
        <TabsContent value="summary">
          <SessionSummary sessionData={session} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
