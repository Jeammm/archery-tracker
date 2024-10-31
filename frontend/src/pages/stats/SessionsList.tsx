import { DataTableColumnHeader } from "@/components/dataTable/column-header";
import { DataTable } from "@/components/dataTable/data-table";
import { useAuth } from "@/context/AuthContext";
import { BASE_BACKEND_URL } from "@/services/baseUrl";
import { Session } from "@/types/session";
import { formatDateTime, timeAgo } from "@/utils/dateTime";
import { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import useFetch from "react-fetch-hook";
import { useNavigate } from "react-router-dom";

interface SessionsWithActions extends Session {
  actions: {
    onClick: (sessionId: string) => void;
  };
}

export const SessionsList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data, isLoading, error } = useFetch(`${BASE_BACKEND_URL}/sessions`, {
    headers: {
      Authorization: `Bearer ${user?.token || ""}`,
    },
  });

  const sessions = data as Session[] | undefined;

  const sessionColumns: ColumnDef<SessionsWithActions>[] = [
    {
      accessorKey: "created_at",
      size: 300,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={"Date"} />
      ),
      cell: ({ row }) => {
        const created_at: string = row.getValue("created_at");
        return (
          <div>
            <p className="whitespace-nowrap">{formatDateTime(created_at)}</p>
            <p className="text-sm text-muted-foreground">
              {timeAgo(created_at)}
            </p>
          </div>
        );
      },
    },
    {
      accessorKey: "session_status",
      header: "Session Status",
      size: 100,
      cell: ({ row }) => {
        const session_status: string = row.getValue("session_status");
        if (session_status === "STARTED") {
          return (
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <p className="font-bold">LIVE</p>
            </div>
          );
        }
        return (
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
            <p className="font-bold">COMPLETED</p>
          </div>
        );
      },
    },
    {
      accessorKey: "processing_status",
      header: () => <p className="whitespace-nowrap">Processing Status</p>,
      size: 100,
    },
    {
      id: "actions",
      header: "",
      size: 100,
      cell: () => {
        return (
          <p className="text-muted-foreground whitespace-nowrap">
            View Results
          </p>
        );
      },
    },
  ];

  const sessionsWithActions: SessionsWithActions[] = useMemo(() => {
    return (
      sessions?.map((session) => {
        return {
          ...session,
          actions: {
            onClick: (sessionId: string) => navigate(`/sessions/${sessionId}`),
          },
        };
      }) || []
    );
  }, [navigate, sessions]);

  if (error) {
    return (
      <div>
        <p>{JSON.stringify(error)}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-4xl font-bold">Training Sessions</h1>
      <p className="mt-2 text-muted-foreground">
        Browse your recent training sessions
      </p>
      <div className="pt-6">
        <DataTable
          columns={sessionColumns}
          data={sessionsWithActions}
          loading={isLoading}
        />
      </div>
    </div>
  );
};
