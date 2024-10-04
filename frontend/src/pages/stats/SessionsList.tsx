import { DataTableColumnHeader } from "@/components/dataTable/column-header";
import { DataTable } from "@/components/dataTable/data-table";
import { useAuth } from "@/context/AuthContext";
import { BASE_BACKEND_URL } from "@/services/baseUrl";
import { Session } from "@/types/session";
import { formatDateTime } from "@/utils/dateTime";
import { ColumnDef } from "@tanstack/react-table";
import { Eye, Play } from "lucide-react";
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

  const {
    data,
    // isLoading,
    error,
  } = useFetch(`${BASE_BACKEND_URL}/sessions`, {
    headers: {
      Authorization: `Bearer ${user?.token || ""}`,
    },
  });

  const sessions = data as Session[] | undefined;

  const sessionColumns: ColumnDef<SessionsWithActions>[] = [
    {
      accessorKey: "created_at",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={"Date"} />
      ),
      cell: ({ row }) => {
        const created_at: string = row.getValue("created_at");
        return formatDateTime(created_at);
      },
    },
    {
      accessorKey: "pose_status",
      header: "Pose Status",
    },
    {
      accessorKey: "target_status",
      header: "Target Status",
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const data = row.original;
        const { pose_status, target_status } = data;

        if (pose_status !== "LIVE" && target_status !== "LIVE") {
          return <Eye />;
        }

        return <Play />;
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

  if (error || !sessions) {
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
        <DataTable columns={sessionColumns} data={sessionsWithActions} />
      </div>
    </div>
  );
};
