import { CardSkeleton, SessionCard } from "@/components/stats/SessionCard";
import { Session, Stats } from "@/types/session";
import { BASE_BACKEND_URL } from "@/services/baseUrl";
import { useAuth } from "@/context/AuthContext";
import { format } from "date-fns";
import { LineChartLabel } from "@/components/chart-line-label";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import axios from "axios";
import { StatHighlight } from "./StatHighlight";

const chartConfig = {
  accuracy: {
    label: "Accuracy",
    color: "hsl(var(--chart-1))",
  },
  totalScore: {
    label: "Total Score",
    color: "hsl(var(--chart-2))",
  },
  maximumScore: {
    label: "Maximum Score",
    color: "hsl(var(--chart-3))",
  },
};

export const Dashboard = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchSessionsData = useCallback(async () => {
    try {
      const response = await axios.get<Session[]>(
        `${BASE_BACKEND_URL}/sessions`,
        {
          headers: {
            Authorization: `Bearer ${user?.token || ""}`,
          },
        }
      );
      setSessions(response.data);
      setError(null); // Clear any previous errors
    } catch (err) {
      console.error("Error fetching sessions:", err);

      // Type guard for AxiosError
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message || err.message || "An error occurred"
        );
      } else {
        // Handle non-Axios errors (unexpected errors)
        setError("An unexpected error occurred");
      }
    }
    setIsLoading(false);
  }, [user?.token]);

  const fetchStatsData = useCallback(async () => {
    try {
      const response = await axios.get<Stats>(
        `${BASE_BACKEND_URL}/dashboard-stats`,
        {
          headers: {
            Authorization: `Bearer ${user?.token || ""}`,
          },
        }
      );
      setStats(response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  }, [user?.token]);

  const sessionsData = useMemo(() => {
    return sessions
      ?.filter((session) => session.maximum_score !== 0)
      .map((session) => {
        return {
          date: `
            ${format(session.created_at, "HH:mm")}\n
            ${format(session.created_at, "dd MMM")}
            `,
          accuracy: Math.floor((session.accuracy || 0) * 100),
          totalScore: session.total_score,
          maximumScore: session.maximum_score,
        };
      })
      .reverse();
  }, [sessions]);

  useEffect(() => {
    fetchSessionsData();

    const intervalId = setInterval(() => {
      fetchSessionsData();
    }, 30000);

    return () => clearInterval(intervalId);
  }, [fetchSessionsData]);

  useEffect(() => {
    fetchStatsData();
  }, [fetchStatsData]);

  if (error || !sessionsData) {
    return (
      <div>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-4xl font-bold">Overview</h1>
      <p className="mt-2 text-muted-foreground">
        {format(new Date(), "hh:mm a 'at' do MMMM yyyy")}
      </p>
      <StatHighlight stats={stats} />
      <div className="mt-2 md:mt-4">
        <LineChartLabel
          title="Performance"
          description="Your recent training"
          chartConfig={chartConfig}
          chartData={sessionsData}
          xAxisDataKey="date"
        />
      </div>
      <div className="mt-8">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold">You Recent Training</h3>
          <Link to="/sessions">
            <ArrowRight />
          </Link>
        </div>
        <div className="w-full flex gap-4 overflow-scroll py-3">
          {isLoading
            ? [1, 2, 3, 4, 5, 6].map((i) => {
                return <CardSkeleton key={`card-skeleton-${i}`} />;
              })
            : sessions?.slice(0, 10).map((session) => {
                return (
                  <SessionCard
                    sessionData={session}
                    fetchSessionsData={fetchSessionsData}
                    key={session._id}
                  />
                );
              })}
        </div>
      </div>
    </div>
  );
};
