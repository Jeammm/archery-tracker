import useFetch from "react-fetch-hook";
import { SessionCard } from "@/components/stats/SessionCard";
import { Session } from "@/types/session";
import { BASE_BACKEND_URL } from "@/services/baseUrl";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import { format } from "date-fns";
import { LineChartLabel } from "@/components/chart-line-label";
import { useMemo } from "react";
import { Monitor, MoveUpRight } from "lucide-react";

export const Dashboard = () => {
  const { user } = useAuth();

  const { data, isLoading, error } = useFetch(`${BASE_BACKEND_URL}/sessions`, {
    headers: {
      Authorization: `Bearer ${user?.token || ""}`,
    },
  });

  const sessions = data as Session[] | undefined;

  const sessionsData = useMemo(() => {
    return sessions
      ?.filter((session) => session.target_status === "SUCCESS")
      .map((session) => {
        return {
          date: session.created_at,
          score: session.score?.reduce((sum, obj) => sum + obj.score, 0),
        };
      });
  }, [sessions]);

  const chartConfig = {
    score: {
      label: "Score",
      color: "hsl(var(--chart-1))",
    },
  };

  if (error || !sessionsData) {
    return (
      <div>
        <p>{JSON.stringify(error)}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-4xl font-bold">Dashboard Overview</h1>
      <p className="mt-2 text-muted-foreground">
        {format(new Date(), "hh:mm a 'at' do MMMM yyyy")}
      </p>
      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="border rounded-lg px-4 py-6">
          <div className="flex items-center">
            <div className="border rounded-md p-2.5 w-fit">
              <Monitor size={18} />
            </div>
            <div className="rounded-full bg-green-500/40 text-green-500 p-0.5 ml-4">
              <MoveUpRight size={16} />
            </div>
            <p className="text-green-500 ml-1">+20.00 %</p>
          </div>
          <h3 className="font-bold text-muted-foreground tracking-wider text-sm mt-2">
            Total Practice
          </h3>
          <p className="font-bold text-2xl tracking-wider mt-1">
            {sessions?.length} Sessions
          </p>
          <p className="text-muted-foreground text-sm">
            Increase from last week ({sessions?.length} sessions)
          </p>
        </div>
        <div className="border rounded-lg px-4 py-6">
          <div className="flex items-center">
            <div className="border rounded-md p-2.5 w-fit">
              <Monitor size={18} />
            </div>
            <div className="rounded-full bg-green-500/40 text-green-500 p-0.5 ml-4">
              <MoveUpRight size={16} />
            </div>
            <p className="text-green-500 ml-1">+20.00 %</p>
          </div>
          <h3 className="font-bold text-muted-foreground tracking-wider text-sm mt-2">
            Total Practice
          </h3>
          <p className="font-bold text-2xl tracking-wider mt-1">
            {sessions?.length} Sessions
          </p>
          <p className="text-muted-foreground text-sm">
            Increase from last week ({sessions?.length} sessions)
          </p>
        </div>
        <div className="border rounded-lg px-4 py-6">
          <div className="flex items-center">
            <div className="border rounded-md p-2.5 w-fit">
              <Monitor size={18} />
            </div>
            <div className="rounded-full bg-green-500/40 text-green-500 p-0.5 ml-4">
              <MoveUpRight size={16} />
            </div>
            <p className="text-green-500 ml-1">+20.00 %</p>
          </div>
          <h3 className="font-bold text-muted-foreground tracking-wider text-sm mt-2">
            Total Practice
          </h3>
          <p className="font-bold text-2xl tracking-wider mt-1">
            {sessions?.length} Sessions
          </p>
          <p className="text-muted-foreground text-sm">
            Increase from last week ({sessions?.length} sessions)
          </p>
        </div>
      </div>
      <div className="mt-4">
        <LineChartLabel
          title="Performance"
          description="Your recent training"
          chartConfig={chartConfig}
          chartData={sessionsData}
          xAxisDataKey="date"
          lineDataKey="score"
          footer={undefined}
        />
      </div>
      <div>
        <div className="flex gap-4 overflow-x-auto py-3">
          {isLoading
            ? [1, 2, 3, 4].map((index) => {
                return <Skeleton key={index} className="w-full h-full" />;
              })
            : sessions?.map((session, index) => {
                return <SessionCard key={index} {...session} />;
              })}
        </div>
      </div>
    </div>
  );
};
