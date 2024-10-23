import { Skeleton } from "@/components/ui/skeleton";
import { Stats, StatsValue } from "@/types/session";
import { Monitor, MoveDownRight, MoveRight, MoveUpRight } from "lucide-react";
import { useMemo } from "react";

interface StatHighlightProps {
  stats: Stats | null;
}

export const StatHighlight = (props: StatHighlightProps) => {
  const { stats } = props;

  if (!stats) {
    return (
      <div className="grid grid-cols-3 gap-4 mt-6">
        <Skeleton className="w-full h-[174px]" />
        <Skeleton className="w-full h-[174px]" />
        <Skeleton className="w-full h-[174px]" />
      </div>
    );
  }

  const getDescription = (stat: StatsValue, name: string) => {
    return stat.compare > 0
      ? `Increase from last week (${stat.last_week.toFixed(2)} ${name})`
      : stat.compare === 0
      ? ""
      : `Decrease from last week (${stat.last_week.toFixed(2)} ${name})`;
  };

  return (
    <div className="grid grid-cols-3 gap-4 mt-6">
      <div className="border rounded-lg px-4 py-6">
        <div className="flex items-center">
          <div className="border rounded-md p-2.5 w-fit">
            <Monitor size={18} />
          </div>
          <CompareIndicatorIcon
            statValue={stats.total_round_count_campare}
            mode="percent"
          />
        </div>
        <h3 className="font-bold text-muted-foreground tracking-wider text-sm mt-2">
          Practice This Week
        </h3>
        <p className="font-bold text-2xl tracking-wider mt-1">
          {stats.total_round_count_campare.current_week} Rounds
        </p>
        <p className="text-muted-foreground text-sm">
          {getDescription(stats.total_round_count_campare, "Rounds")}
        </p>
      </div>

      <div className="border rounded-lg px-4 py-6">
        <div className="flex items-center">
          <div className="border rounded-md p-2.5 w-fit">
            <Monitor size={18} />
          </div>
          <CompareIndicatorIcon
            statValue={stats.total_accuracy_compare}
            mode="raw"
            name="Points"
          />
        </div>
        <h3 className="font-bold text-muted-foreground tracking-wider text-sm mt-2">
          Weekly Average Score
        </h3>
        <p className="font-bold text-2xl tracking-wider mt-1">
          {stats.total_accuracy_compare.current_week} Points
        </p>
        <p className="text-muted-foreground text-sm">
          {getDescription(stats.total_accuracy_compare, "Points")}
        </p>
      </div>

      <div className="border rounded-lg px-4 py-6">
        <div className="flex items-center">
          <div className="border rounded-md p-2.5 w-fit">
            <Monitor size={18} />
          </div>
          <CompareIndicatorIcon
            statValue={stats.total_accuracy_compare}
            mode="percent"
          />
        </div>
        <h3 className="font-bold text-muted-foreground tracking-wider text-sm mt-2">
          Practice Time This Week
        </h3>
        <p className="font-bold text-2xl tracking-wider mt-1">
          {stats.total_training_time_compare.current_week.toFixed(2)} Seconds
        </p>
        <p className="text-muted-foreground text-sm">
          {getDescription(stats.total_training_time_compare, "Seconds")}
        </p>
      </div>
    </div>
  );
};

interface CompareIndicatorIconProps {
  statValue: StatsValue;
  mode: "raw" | "percent";
  name?: string;
}

const CompareIndicatorIcon = (props: CompareIndicatorIconProps) => {
  const { statValue, mode, name } = props;

  const changeAmount = useMemo(() => {
    if (mode === "raw") {
      return Math.abs(statValue.compare).toFixed(2);
    }
    if (statValue.last_week === 0) {
      return 100;
    }

    return ((statValue.compare / statValue.last_week) * 100).toFixed(2);
  }, [mode, statValue]);

  if (statValue.compare === 0) {
    return (
      <>
        <div className="rounded-full bg-muted/40 text-muted-foreground p-0.5 ml-4">
          <MoveRight size={16} />
        </div>
        <p className="text-muted-foreground ml-1">+ 0 {name ? name : "%"}</p>
      </>
    );
  }

  if (statValue.compare > 0) {
    return (
      <>
        <div className="rounded-full bg-green-500/40 text-green-500 p-0.5 ml-4">
          <MoveUpRight size={16} />
        </div>
        <p className="text-green-500 ml-1">
          + {changeAmount} {name ? name : "%"}
        </p>
      </>
    );
  }

  return (
    <>
      <div className="rounded-full bg-red-500/40 text-red-500 p-0.5 ml-4">
        <MoveDownRight size={16} />
      </div>
      <p className="text-red-500 ml-1">
        - {changeAmount} {name ? name : "%"}
      </p>
    </>
  );
};
