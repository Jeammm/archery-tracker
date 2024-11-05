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

  return (
    <div className="mt-1 md:mt-6">
      <Table className="border">
        <TableHeader>
          <TableRow>
            <TableHead className="text-center">Round</TableHead>
            <TableHead className="text-center">Shot</TableHead>
            <TableHead className="text-center">Time</TableHead>
            {/* <TableHead>Hit</TableHead> */}
            <TableHead className="text-center">Score</TableHead>
            <TableHead className="text-center">Total</TableHead>
            <TableHead className="text-center">Sum</TableHead>
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
                  <TableCell className="border-x text-center" colSpan={3}>
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
                <TableRow className="text-center">
                  <TableCell className="border-x text-center">
                    {roundNo + 1}
                  </TableCell>
                  <TableCell
                    colSpan={3}
                    className="text-muted-foreground italic"
                  >
                    No hit detected
                  </TableCell>
                  <TableCell className="border-x">0</TableCell>
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
                    <TableRow
                      key={`shot-row-${round._id}-${hit.id}-origin`}
                      className="text-center"
                    >
                      <TableCell
                        rowSpan={round.score?.length}
                        className="border-x text-center"
                      >
                        {roundNo + 1}
                      </TableCell>
                      <TableCell>{hit.id}</TableCell>
                      <TableCell>
                        {hit.hit_time
                          ? format(hit.hit_time, "hh:mm:ss a")
                          : "-"}
                      </TableCell>
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
                  <TableRow
                    key={`shot-row-${round._id}-${hit.id}-child`}
                    className="text-center"
                  >
                    <TableCell>{hit.id}</TableCell>
                    <TableCell>
                      {hit.hit_time ? format(hit.hit_time, "hh:mm:ss a") : "-"}
                    </TableCell>
                    <TableCell>{hit.score}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          );
        })}
        <TableFooter>
          <TableRow>
            <TableCell colSpan={5}>Total Score</TableCell>
            <TableCell>{sessionData.total_score}</TableCell>
          </TableRow>
        </TableFooter>
      </Table>

      <div className="mt-2 md:mt-4 grid grid-cols-1 md:grid-cols-3 gap-y-2 md:gap-4">
        <div className="col-span-2">
          <GeneralShotDataChart round_result={round_result} />
        </div>
        <ChartPie
          round_result={round_result}
          title="Totle Shot Score"
          description="All your shots"
          nameKey="round"
          dataKey="score"
          totalLable="Points"
        />
      </div>
    </div>
  );
};
