import { Skeleton } from "@/components/ui/skeleton";
import { Stats, StatsValue } from "@/types/session";
import { get } from "lodash";
import {
  Monitor,
  MoveDownRight,
  MoveRight,
  MoveUpRight,
  Timer,
  Trophy,
} from "lucide-react";
import { useMemo } from "react";

interface StatHighlightProps {
  stats: Stats | null;
}

export const StatHighlight = (props: StatHighlightProps) => {
  const { stats } = props;

  if (!stats) {
    return (
      <div className="flex overflow-x-auto no-scrollbar sm:grid sm:grid-cols-2 md:grid-cols-3 gap-2 md:gap-4 mt-6 pb-1.5 sm:pb-0">
        <Skeleton className="md:min-w-full min-w-[272px] h-[118px] md:h-[174px]" />
        <Skeleton className="md:min-w-full min-w-[272px] h-[118px] md:h-[174px]" />
        <Skeleton className="md:min-w-full min-w-[272px] h-[118px] md:h-[174px]" />
      </div>
    );
  }

  return (
    <div className="flex overflow-x-auto no-scrollbar sm:grid sm:grid-cols-2 md:grid-cols-3 gap-2 md:gap-4 mt-6 pb-1.5 sm:pb-0">
      {Object.keys(stats).map((key) => {
        return (
          <StatHighlightItem
            statValue={get(stats, key)}
            statKey={key}
            key={key}
          />
        );
      })}
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
        <div className="rounded-full bg-muted/40 text-muted-foreground p-0.5">
          <MoveRight size={16} />
        </div>
        <p className="text-muted-foreground ml-1">+ 0 {name ? name : "%"}</p>
      </>
    );
  }

  if (statValue.compare > 0) {
    return (
      <>
        <div className="rounded-full bg-green-500/40 text-green-500 p-0.5">
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
      <div className="rounded-full bg-red-500/40 text-red-500 p-0.5">
        <MoveDownRight size={16} />
      </div>
      <p className="text-red-500 ml-1">
        - {Math.abs(Number(changeAmount))} {name ? name : "%"}
      </p>
    </>
  );
};

const StatHighlightItem = ({
  statValue,
  statKey,
}: {
  statValue: StatsValue;
  statKey: string;
}) => {
  const getDescription = (stat: StatsValue, name: string) => {
    return stat.compare > 0
      ? `Increase from last week (${(stat.last_week).toFixed(
          2
        )} ${name})`
      : stat.compare === 0
      ? ""
      : `Decrease from last week (${(stat.last_week).toFixed(
          2
        )} ${name})`;
  };

  const getTitle = () => {
    if (statKey === "total_round_count_campare") {
      return "Practice Rounds";
    }

    if (statKey === "total_accuracy_compare") {
      return "Average Score";
    }
    if (statKey === "total_training_time_compare") {
      return "Practice Time";
    }
  };

  const getNoun = () => {
    if (statKey === "total_round_count_campare") {
      return "Rounds";
    }

    if (statKey === "total_accuracy_compare") {
      return "Points";
    }
    if (statKey === "total_training_time_compare") {
      return "Minutes";
    }

    return "";
  };
  const getIcon = () => {
    if (statKey === "total_round_count_campare") {
      return <Monitor size={18} />;
    }

    if (statKey === "total_accuracy_compare") {
      return <Trophy size={18} />;
    }
    if (statKey === "total_training_time_compare") {
      return <Timer size={18} />;
    }

    return "";
  };

  return (
    <div className="border rounded-lg p-3 md:px-4 md:py-6">
      <div className="items-center hidden md:flex">
        <div className="border rounded-md p-2.5 w-fit hidden md:block mr-4">
          {getIcon()}
        </div>
        <CompareIndicatorIcon
          statValue={statValue}
          mode="raw"
          name={getNoun()}
        />
      </div>
      <div className="flex gap-2 items-center md:mt-2">
        <h3 className="font-bold text-muted-foreground tracking-wider text-sm whitespace-nowrap">
          {getTitle()}
        </h3>
      </div>
      <div className="flex items-center md:hidden whitespace-nowrap">
        <CompareIndicatorIcon
          statValue={statValue}
          mode="raw"
          name={getNoun()}
        />
      </div>
      <p className="font-bold text-lg sm:text-2xl tracking-wider sm:mt-1">
        {(statValue.current_week).toFixed(2)} {getNoun()}
      </p>
      <p className="text-muted-foreground text-sm whitespace-nowrap md:whitespace-normal">
        {getDescription(statValue, getNoun())}
      </p>
    </div>
  );
};
