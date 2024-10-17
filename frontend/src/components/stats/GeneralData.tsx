import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Round, Session } from "@/types/session";
import { Loader } from "../ui/loader";
import { calculateAccumulatedScore } from "@/utils/formatScore";
import { format } from "date-fns";
import { ChartBar } from "../chart-bar";
import { useCallback, useMemo } from "react";
import { ProcessingFailed } from "./RetryButton";

interface GeneralDataProps {
  sessionData: Session;
}

export const GeneralData = (props: GeneralDataProps) => {
  const { sessionData } = props;

  const { round_result } = sessionData;

  // const accumulatedScore = calculateAccumulatedScore(
  //   sessionData.score?.map((score) => score.score) || []
  // );

  const getTotalScore = (round: Round) => {
    return round.score?.reduce((sum, obj) => sum + obj.score, 0) || 1;
  };

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

  const getRoundData = (rounds: Round[]) => {
    const roundsData = [];
    return (
      rounds.map((round) => {
        round.score?.map((hit) => {
          roundsData.push({
            shotNo: hit.id,
            score: hit.score,
          });
        });
      }) || []
    );
  };

  // if (target_status === "FAILURE") {
  //   return <ProcessingFailed sessionData={sessionData} />;
  // }

  // if (target_status !== "SUCCESS") {
  //   return (
  //     <div className="mt-4 border p-6">
  //       <Loader>Processing...</Loader>
  //     </div>
  //   );
  // }

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
          {round_result.map((round, index) => {
            return round.score?.map((hit) => {
              if (index === 0) {
                return (
                  <TableRow>
                    <TableCell
                      rowSpan={round.score?.length}
                      className="border-x text-center"
                    >
                      1
                    </TableCell>
                    <TableCell>{hit.id}</TableCell>
                    <TableCell>{hit.score}</TableCell>
                    <TableCell>{format(hit.hit_time, "hh:mm:ss")}</TableCell>
                    <TableCell>{`[x: ${hit.point[0]}, y: ${hit.point[1]}]`}</TableCell>
                    {/* <TableCell>{accumulatedScore[index]}</TableCell> */}
                    <TableCell
                      rowSpan={round.score?.length}
                      className="border-x text-center"
                    >
                      {getTotalScore(round)}
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
                  {/* <TableCell>{accumulatedScore[index]}</TableCell> */}
                </TableRow>
              );
            });
          })}
        </TableBody>
      </Table>

      <div className="mt-4 grid grid-cols-2">
        <ChartBar
          title="Shot Statistic"
          description="Your Shot Statistic"
          chartConfig={chartConfig}
          chartData={getRoundData(round_result)}
          xAxisDataKey="shotNo"
          lineDataKey={["score", "accScore"]}
          footer={undefined}
          stack
        />
      </div>
    </div>
  );
};
