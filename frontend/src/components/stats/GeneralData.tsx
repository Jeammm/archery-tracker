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
import { ChartPie } from "../chart-pie";
import { useMemo } from "react";
import { set } from "lodash";
import { GeneralShotDataChart } from "../charts/GeneralShotDataChart";

interface GeneralDataProps {
  sessionData: Session;
}

export const GeneralData = (props: GeneralDataProps) => {
  const { sessionData } = props;

  const { round_result } = sessionData;

  const accumulatedScore = calculateAccumulatedScore(round_result);

  const getTotalScore = (round: Round) => {
    return round.score?.reduce((sum, obj) => sum + obj.score, 0) || 1;
  };

  const pieChartConfig = useMemo(() => {
    const config = {};

    round_result.map((round, index) => {
      set(config, round._id, {
        label: `Round ${index + 1}`,
        color: `hsl(var(--chart-${(index % 5) + 1}))`,
      });
    });

    return config;
  }, [round_result]);

  return (
    <div className="mt-6">
      <Table className="border">
        <TableHeader>
          <TableRow>
            <TableHead>Round</TableHead>
            <TableHead>Shot No.</TableHead>
            <TableHead>TTS (ms)</TableHead>
            <TableHead>Posture Score</TableHead>
            <TableHead>Score</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Acc. Score</TableHead>
          </TableRow>
        </TableHeader>

        {round_result.map((round, roundNo) => {
          if (round.target_status === "FAILURE") {
            return (
              <TableBody key={`failed-${round._id}`}>
                <TableRow>
                  <TableCell className="border-x text-center">
                    {roundNo + 1}
                  </TableCell>
                  <TableCell className="border-x text-center" colSpan={4}>
                    {round.target_error_message}
                    {round.pose_error_message}
                  </TableCell>

                  <TableCell className="border-x text-center" colSpan={2}>
                    Error!
                  </TableCell>
                </TableRow>
              </TableBody>
            );
          }

          if (!round.score) {
            return (
              <TableBody key={`processing-${round._id}`}>
                <TableRow>
                  <TableCell className="border-x text-center">
                    {roundNo + 1}
                  </TableCell>
                  <TableCell colSpan={999} className="border-x text-center">
                    <Loader>Processing...</Loader>
                  </TableCell>
                </TableRow>
              </TableBody>
            );
          }

          if (round.score.length === 0) {
            return (
              <TableBody key={`empty-${round._id}`}>
                <TableRow>
                  <TableCell className="border-x text-center">
                    {roundNo + 1}
                  </TableCell>
                  <TableCell
                    colSpan={4}
                    className="text-muted-foreground italic text-center"
                  >
                    No hit detected
                  </TableCell>
                  <TableCell className="border-x text-center">0</TableCell>
                  <TableCell>{accumulatedScore[roundNo]}</TableCell>
                </TableRow>
              </TableBody>
            );
          }

          return (
            <TableBody
              className="hover:bg-muted/50 group/multirow"
              key={`success-${round._id}`}
            >
              {round.score.map((hit, shotNo) => {
                if (shotNo === 0) {
                  return (
                    <TableRow key={`shot-row-${round._id}-${hit.id}-origin`}>
                      <TableCell
                        rowSpan={round.score?.length}
                        className="border-x text-center"
                      >
                        {roundNo + 1}
                      </TableCell>
                      <TableCell>{hit.id}</TableCell>
                      <TableCell>{format(hit.hit_time, "hh:mm:ss")}</TableCell>
                      <TableCell>{`[x: ${hit.point[0]}, y: ${hit.point[1]}]`}</TableCell>
                      <TableCell>{hit.score}</TableCell>
                      <TableCell
                        rowSpan={round.score?.length}
                        className="border-x text-center"
                      >
                        {getTotalScore(round)}
                      </TableCell>
                      <TableCell rowSpan={round.score?.length}>
                        {accumulatedScore[roundNo]}
                      </TableCell>
                    </TableRow>
                  );
                }
                return (
                  <TableRow key={`shot-row-${round._id}-${hit.id}-child`}>
                    <TableCell>{hit.id}</TableCell>
                    <TableCell>{format(hit.hit_time, "hh:mm:ss")}</TableCell>
                    <TableCell>{`[x: ${hit.point[0]}, y: ${hit.point[1]}]`}</TableCell>
                    <TableCell>{hit.score}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          );
        })}
        <TableFooter>
          <TableRow>
            <TableCell colSpan={6}>Total Score</TableCell>
            <TableCell>{sessionData.total_score}</TableCell>
          </TableRow>
        </TableFooter>
      </Table>

      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <GeneralShotDataChart round_result={round_result} />
        </div>
        <ChartPie
          chartData={round_result.map((round) => ({
            round: round._id,
            score: round.total_score,
            fill: `var(--color-${round._id})`,
          }))}
          title="Totle Shot Score"
          description="All your shots"
          chartConfig={pieChartConfig}
          nameKey="round"
          dataKey="score"
          totalLable="Points"
        />
      </div>
    </div>
  );
};
