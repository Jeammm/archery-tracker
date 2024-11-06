import { Button } from "@/components/ui/button";
import { FlipWords } from "@/components/ui/flip-words";
import { Link } from "react-router-dom";

import KU from "@/assets/ku-logo.png";
import Byteark from "@/assets/byteark-logo.png";
import OpenCV from "@/assets/opencv-logo.png";
import TargetScoring from "@/assets/scoring_banner.png";
import PostureTracking from "@/assets/posture_banner.png";
import PostureTrackingDark from "@/assets/posture_banner_inverse.png";
import Stat from "@/assets/stat_banner.png";
import StatLight from "@/assets/stat_banner_light.png";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

export const Home = () => {
  const { lightOrDark } = useTheme();

  return (
    <div
      className={cn([
        "w-screen min-h-screen flex justify-center p-8 pt-36",
        lightOrDark === "dark" ? "bg-grid-pattern" : "bg-grid-pattern-light",
      ])}
    >
      <div className="grid grid-cols-1 xl:grid-cols-2 max-w-[1344px] gap-6">
        <div className="flex flex-col">
          <h1 className="font-semibold mb-6 md:text-7xl text-5xl">
            Precision Training <br />
            Improving Your <br className="blokc sm:hidden md:block" />
            <FlipWords
              words={["Accuracy", "Posture", "Score"]}
              className="px-0"
            />
          </h1>
          <h2 className="mb-6 font-serif">
            Access detailed performance data, improve your technique, and track
            your progress{" "}
            <span className="inline-block">like never before.</span>
          </h2>
          <div className="flex gap-4 mb-6 flex-col sm:flex-row">
            <Link to="/trainingSession" className="flex-1 sm:flex-grow-0">
              <Button
                className="text-sm rounded-2xl h-14 md:w-52 w-full"
                size="lg"
              >
                Start Training
              </Button>
            </Link>
            <Link to="/dashboard" className="flex-1 sm:flex-grow-0">
              <Button
                className="text-sm rounded-2xl h-14 md:w-52 w-full border-2 drop-shadow-md"
                size="lg"
                variant="outline"
              >
                See your stats
              </Button>
            </Link>
          </div>
          <div className="flex gap-5 mb-20 mt-6">
            <div className="flex gap-2 items-center">
              <img
                src={Byteark}
                alt="byteark"
                className="w-10 h-10 object-contain filter brightness-150"
              />
              <p className="text-xs text-zinc-500">ByteArk</p>
            </div>
            <div className="flex gap-2 items-center">
              <img
                src={OpenCV}
                alt="opencv"
                className="w-10 h-10 object-contain filter brightness-150 contrast-50"
              />
              <p className="text-xs text-zinc-500">OpenCV</p>
            </div>
            <div className="flex gap-2 items-center">
              <img
                src={KU}
                alt="kasetsart"
                className="w-10 h-10 object-contain filter brightness-150 contrast-50"
              />
              <p className="text-xs text-zinc-500">Kasetsart</p>
            </div>
          </div>
        </div>
        <div>
          <div className="h-[300px] w-full border rounded-sm mb-2 overflow-hidden bg-background">
            <img
              src={Stat}
              className={cn([
                "w-full h-full object-cover",
                lightOrDark === "light" && "hidden",
              ])}
              alt="stat"
            />
            <img
              src={StatLight}
              className={cn([
                "w-full h-full object-cover",
                lightOrDark === "dark" && "hidden",
              ])}
              alt="stat"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 mt-4 gap-4">
            <div className="h-[220px] w-full border rounded-sm mb-2 overflow-hidden">
              <img
                src={TargetScoring}
                className="w-full h-full object-cover"
                alt="target scoring"
              />
            </div>

            <div
              className={cn([
                "h-[220px] w-full border rounded-sm mb-2 overflow-hidden ",
                lightOrDark === "light" ? "bg-white" : "bg-black",
              ])}
            >
              <img
                src={PostureTrackingDark}
                className={cn([
                  "w-full h-full object-contain",
                  lightOrDark === "light" && "hidden",
                ])}
                alt="posture tracking"
              />
              <img
                src={PostureTracking}
                className={cn([
                  "w-full h-full object-contain",
                  lightOrDark === "dark" && "hidden",
                ])}
                alt="posture tracking"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
