import { Hit, Session } from "@/types/session";
import { useMemo } from "react";
import { SkeletonFeature } from "./SkeletonFeature";
import DEFAULE_IMAGE from "/placeholder-image.jpg";
import MockPosture from "@/assets/mock/mock_posture.png";
import MockTarget from "@/assets/mock/mock_target.png";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import { TargetImageWithShotOverlay } from "./TargetImageWithShotOverlay";
import { formatTTS } from "@/utils/formatScore";

interface SessionSummaryProps {
  sessionData: Session;
}

export const SessionSummary = (props: SessionSummaryProps) => {
  const { sessionData } = props;

  const { round_result, features } = sessionData;

  const isNoScoreAtAll = useMemo(() => {
    return (
      round_result.filter((round) => round.score?.length !== 0).length === 0
    );
  }, [round_result]);

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

    if (isNoScoreAtAll) {
      return MockTarget;
    }

    return DEFAULE_IMAGE;
  }, [isNoScoreAtAll, round_result]);

  const poseImageDemo = useMemo(() => {
    if (!Array.isArray(round_result)) {
      return MockPosture;
    }

    for (const item of round_result) {
      if (item?.score?.[0]?.pose_image_url) {
        return item.score[0].pose_image_url;
      }
    }

    if (isNoScoreAtAll) {
      return MockPosture;
    }

    return DEFAULE_IMAGE;
  }, [isNoScoreAtAll, round_result]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1 md:mt-6">
      <div className="rounded-lg p-2 border text-secondary-foreground flex flex-col items-center relative">
        {isNoScoreAtAll && <NoShotBlurOverlay />}
        <p className="w-full text-center font-bold text-lg mb-2">
          Average Aiming Posture
        </p>
        <div className="w-full">
          <img
            src={poseImageDemo}
            alt="average posture"
            className="w-full h-auto aspect-[4/3] object-cover"
          />
        </div>
        <div className="w-full mt-3">
          <SkeletonFeature features={features} />
        </div>
      </div>
      <div className="rounded-lg p-2 border text-secondary-foreground flex flex-col items-center relative">
        {isNoScoreAtAll && <NoShotBlurOverlay />}
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
                    ? (
                        (sessionData.total_score / sessionData.maximum_score) *
                        10
                      ).toFixed(2)
                    : 0}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold">Accuracy</TableCell>
                <TableCell>
                  {sessionData.accuracy ? (sessionData.accuracy * 100).toFixed(2) : 0} %
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold">Average TTS</TableCell>
                <TableCell>{formatTTS(sessionData.average_tts)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold">
                  Total Training Time
                </TableCell>
                <TableCell>
                  {(sessionData.total_session_time / 60).toFixed(2)} minutes
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

const NoShotBlurOverlay = () => {
  return (
    <div className="absolute w-full h-full bg-background/60 backdrop-blur-xl flex flex-col gap-4 justify-center items-center z-[1000] -mt-2 rounded-lg">
      <p className="text-2xl italic tracking-wide font-semibold">
        No Posture Data
      </p>
      <p className="italic text-center text-muted-foreground text-sm px-5">
        This session have not detected a single shot. In order to see result
        summaries, you must start a new round and land some shot on the target!
      </p>
    </div>
  );
};
