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

  const chartConfig = {
    score: {
      label: "Score",
      color: "hsl(var(--chart-1))",
    },
  };

  const getRoundData = (rounds: Round[]) => {
    const roundsData: { shotNo: string; score: number }[] = [];

    rounds.map((round) => {
      round.score?.map((hit) => {
        roundsData.push({
          shotNo: hit.id,
          score: hit.score,
        });
      });
    });

    return roundsData;
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
              <TableBody>
                <TableRow>
                  <TableCell className="border-x text-center">
                    {roundNo + 1}
                  </TableCell>
                  <TableCell className="border-x text-center">
                    {round.target_error_message}
                  </TableCell>
                  <TableCell className="border-x text-center">
                    {round.pose_error_message}
                  </TableCell>
                  <TableCell colSpan={99} className="border-x text-center">
                    Error!
                  </TableCell>
                </TableRow>
              </TableBody>
            );
          }

          if (round.target_status !== "SUCCESS" || !round.score) {
            return (
              <TableBody>
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
              <TableBody>
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
            <TableBody className="hover:bg-muted/50 group/multirow">
              {round.score.map((hit, shotNo) => {
                if (shotNo === 0) {
                  return (
                    <TableRow>
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
                  <TableRow>
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

      <div className="mt-4 grid grid-cols-2">
        <ChartBar
          title="Shot Statistic"
          description="Your Shot Statistic"
          chartConfig={chartConfig}
          chartData={getRoundData(round_result)}
          xAxisDataKey="shotNo"
          footer={undefined}
          stack
        />
      </div>
    </div>
  );
};
