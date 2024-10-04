import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Session } from "@/types/session";
import { Loader } from "../ui/loader";

interface GeneralDataProps {
  sessionData: Session;
}

export const GeneralData = (props: GeneralDataProps) => {
  const { sessionData } = props;

  const { target_status } = sessionData;

  if (target_status !== "SUCCESS") {
    return (
      <div className="mt-4 border p-6">
        <Loader>Processing...</Loader>
      </div>
    );
  }

  return (
    <div className="m-8">
      <h2>ข้อมูลทั่วไป</h2>
      <Table>
        <TableCaption>General data</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Round</TableHead>
            <TableHead>Score</TableHead>
            <TableHead>TTS (ms)</TableHead>
            <TableHead>Posture Score</TableHead>
            <TableHead>Total Score</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell rowSpan={4} className="text-center border-x">
              1
            </TableCell>
            <TableCell>9</TableCell>
            <TableCell>2004</TableCell>
            <TableCell>90 %</TableCell>
            <TableCell rowSpan={4} className="text-center border-x">
              37 (x)
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>10</TableCell>
            <TableCell>2004</TableCell>
            <TableCell>90 %</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>9</TableCell>
            <TableCell>2004</TableCell>
            <TableCell>90 %</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>10 (x)</TableCell>
            <TableCell>2004</TableCell>
            <TableCell>90 %</TableCell>
          </TableRow>
        </TableBody>

        <TableFooter>
          <TableRow>
            <TableCell colSpan={4}>Total Score</TableCell>
            <TableCell className="text-center">37 (x)</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
};
