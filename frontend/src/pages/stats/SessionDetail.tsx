import { DetailedShotData } from "@/components/stats/DetailedShotData";
import { GeneralData } from "@/components/stats/GeneralData";
import { SessionSummary } from "@/components/stats/SessionSummary";
import { SessionVideo } from "@/components/stats/SessionVideo";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { useEffect, useMemo, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";

export const SessionDetail = () => {
  const { user } = useAuth();
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [searchParams, setSearchParmas] = useSearchParams();
  const tab = searchParams.get("tab");
  const onChangeTab = (value: string) => {
    setSearchParmas((prev) => ({ ...prev, tab: value }));
  };

  const [session, setSession] = useState<Session | null>(null);
  const [conditionMet, setConditionMet] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [selectedRound, setSelectedRound] = useState<number>(0);

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
        navigate(0);
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Error ending session:", error);
    }
  };

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

  const isRoundExisted = useMemo(() => {
    return (
      (session?.round_result && session?.round_result?.length >= 1) || false
    );
  }, [session?.round_result]);

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
          <div className="flex flex-col gap-1.5 items-end">
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

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive" className="w-fit">
                  End this session
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>End this session</DialogTitle>
                  <DialogDescription>
                    {isRoundExisted
                      ? "This session will be marked as ended, you can rest now"
                      : "This session has not a single round, ending this session now will resulted in this session getting deleted."}
                  </DialogDescription>
                </DialogHeader>

                <DialogFooter>
                  <DialogClose>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <DialogClose>
                    <Button
                      variant="destructive"
                      onClick={() => onClickEndSession(isRoundExisted)}
                    >
                      End session
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      <Tabs
        value={tab || "general"}
        onValueChange={onChangeTab}
        className="mt-6"
      >
        <div className="flex justify-between">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="detail">Detail</TabsTrigger>
            <TabsTrigger value="video">Video</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
          </TabsList>

          {tab === "video" && isRoundExisted && (
            <Select onValueChange={(value) => setSelectedRound(Number(value))}>
              <SelectTrigger className="w-[180px]">
                Round {selectedRound + 1}
              </SelectTrigger>
              <SelectContent>
                {session.round_result.map((round, index) => {
                  return (
                    <SelectItem
                      value={`${index}`}
                      key={`round-selector-${round._id}`}
                    >
                      Round {index + 1}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          )}
        </div>
        <TabsContent value="general">
          {isRoundExisted ? (
            <GeneralData sessionData={session} />
          ) : (
            <div className="w-full text-lg text-muted-foreground text-center italic mt-5 font-semibold">
              No round data yet...
            </div>
          )}
        </TabsContent>
        <TabsContent value="detail">
          {isRoundExisted ? (
            <DetailedShotData sessionData={session} />
          ) : (
            <div className="w-full text-lg text-muted-foreground text-center italic mt-5 font-semibold">
              No round data yet...
            </div>
          )}
        </TabsContent>
        <TabsContent value="video">
          {isRoundExisted ? (
            <SessionVideo
              sessionData={session}
              selectedRound={selectedRound}
              key={`round-${selectedRound}`}
            />
          ) : (
            <div className="w-full text-lg text-muted-foreground text-center italic mt-5 font-semibold">
              No round data yet...
            </div>
          )}
        </TabsContent>
        <TabsContent value="summary">
          {isRoundExisted ? (
            <SessionSummary sessionData={session} />
          ) : (
            <div className="w-full text-lg text-muted-foreground text-center italic mt-5 font-semibold">
              No round data yet...
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
