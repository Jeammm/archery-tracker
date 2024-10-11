import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Session } from "@/types/session";
import { Loader } from "../ui/loader";
import { calculateAccumulatedScore } from "@/utils/formatScore";
import { format } from "date-fns";
import { ChartBar } from "../chart-bar";
import { useMemo } from "react";
import { ProcessingFailed } from "./RetryButton";

interface GeneralDataProps {
  sessionData: Session;
}

export const GeneralData = (props: GeneralDataProps) => {
  const { sessionData } = props;

  const { target_status } = sessionData;

  const accumulatedScore = calculateAccumulatedScore(
    sessionData.score?.map((score) => score.score) || []
  );

  const totalScore =
    sessionData.score?.reduce((sum, obj) => sum + obj.score, 0) || 1;

  const chartConfig = {
    score: {
      label: "Score",
      color: "hsl(var(--chart-1))",
    },
    accScore: {
      label: "Accumulated",
      color: "hsl(var(--chart-2))",
    },
  };

  const shotData = useMemo(() => {
    return (
      sessionData.score?.map((hit, index) => {
        return {
          shotNo: hit.id,
          score: hit.score,
          accScore: accumulatedScore[index],
        };
      }) || []
    );
  }, [accumulatedScore, sessionData.score]);

  if (target_status === "FAILURE") {
    return <ProcessingFailed sessionData={sessionData}/>;
  }

  if (target_status !== "SUCCESS") {
    return (
      <div className="mt-4 border p-6">
        <Loader>Processing...</Loader>
      </div>
    );
  }

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Round</TableHead>
            <TableHead>Shot No.</TableHead>
            <TableHead>Score</TableHead>
            <TableHead>TTS (ms)</TableHead>
            <TableHead>Posture Score</TableHead>
            <TableHead>Acc. Score</TableHead>
            <TableHead>Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sessionData.score
            ?.sort((a, b) => Number(a.id) - Number(b.id))
            .map((hit, index) => {
              if (index === 0) {
                return (
                  <TableRow>
                    <TableCell
                      rowSpan={sessionData.score?.length}
                      className="border-x text-center"
                    >
                      1
                    </TableCell>
                    <TableCell>{hit.id}</TableCell>
                    <TableCell>{hit.score}</TableCell>
                    <TableCell>{format(hit.hit_time, "hh:mm:ss")}</TableCell>
                    <TableCell>{`[x: ${hit.point[0]}, y: ${hit.point[1]}]`}</TableCell>
                    <TableCell>{accumulatedScore[index]}</TableCell>
                    <TableCell
                      rowSpan={sessionData.score?.length}
                      className="border-x text-center"
                    >
                      {totalScore}
                    </TableCell>
                  </TableRow>
                );
              }
              return (
                <TableRow>
                  <TableCell>{hit.id}</TableCell>
                  <TableCell>{hit.score}</TableCell>
                  <TableCell>{format(hit.hit_time, "hh:mm:ss")}</TableCell>
                  <TableCell>{`[x: ${hit.point[0]}, y: ${hit.point[1]}]`}</TableCell>
                  <TableCell>{accumulatedScore[index]}</TableCell>
                </TableRow>
              );
            })}
        </TableBody>

        <TableFooter>
          <TableRow>
            <TableCell colSpan={6}>Total Score</TableCell>
            <TableCell className="text-center">{totalScore}</TableCell>
          </TableRow>
        </TableFooter>
      </Table>

      <div className="mt-4 grid grid-cols-2">
        <ChartBar
          title="Shot Statistic"
          description="Your Shot Statistic"
          chartConfig={chartConfig}
          chartData={shotData}
          xAxisDataKey="shotNo"
          lineDataKey={["score", "accScore"]}
          footer={undefined}
          stack
        />
        <div></div>
      </div>
    </div>
  );
};
