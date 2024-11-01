import { Hit, Session } from "@/types/session";
import { useMemo } from "react";
import { SkeletonFeature } from "./SkeletonFeature";
import DEFAULE_IMAGE from "/placeholder-image.jpg";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import { TargetImageWithShotOverlay } from "./TargetImageWithShotOverlay";

interface SessionSummaryProps {
  sessionData: Session;
}

export const SessionSummary = (props: SessionSummaryProps) => {
  const { sessionData } = props;

  const { round_result, features } = sessionData;

  const allHits = useMemo(() => {
    const hits: Hit[] = [];

    round_result.map((round) => round.score?.map((hit) => hits.push(hit)));

    return hits;
  }, [round_result]);

  const targetImageDemo = useMemo(() => {
    if (!Array.isArray(round_result)) {
      return DEFAULE_IMAGE;
    }

    for (const item of round_result) {
      if (item?.score?.[0]?.target_image_url) {
        return item.score[0].target_image_url;
      }
    }

    return DEFAULE_IMAGE;
  }, [round_result]);

  const poseImageDemo = useMemo(() => {
    if (!Array.isArray(round_result)) {
      return DEFAULE_IMAGE;
    }

    for (const item of round_result) {
      if (item?.score?.[0]?.pose_image_url) {
        return item.score[0].pose_image_url;
      }
    }

    return DEFAULE_IMAGE;
  }, [round_result]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1 md:mt-6">
      <div className="rounded-lg p-2 border text-secondary-foreground flex flex-col items-center">
        <p className="w-full text-center font-bold text-lg mb-2">
          Average Posture
        </p>
        <div className="w-full">
          <img src={poseImageDemo} alt="" className="w-full h-auto" />
        </div>
        <div className="w-full mt-3">
          <SkeletonFeature features={features} />
        </div>
      </div>
      <div className="rounded-lg p-2 border text-secondary-foreground flex flex-col items-center">
        <p className="w-full text-center font-bold text-lg mb-2">Total Score</p>
        <TargetImageWithShotOverlay
          targetImage={targetImageDemo}
          hits={allHits}
        />

        <div className="w-full mt-3">
          <Table className="border">
            <TableHeader>
              <TableRow className="font-bold">
                <TableCell>Data</TableCell>
                <TableCell>Value</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-semibold">Total Score</TableCell>
                <TableCell>{sessionData.total_score}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold">Average Score</TableCell>
                <TableCell>
                  {sessionData.total_score && sessionData.maximum_score
                    ? (sessionData.total_score / sessionData.maximum_score) * 10
                    : 0}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold">Average TTS</TableCell>
                <TableCell>{2012} ms</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold">Accuracy</TableCell>
                <TableCell>
                  {sessionData.accuracy ? sessionData.accuracy * 100 : 0} %
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold">Time</TableCell>
                <TableCell>{35} min</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};
