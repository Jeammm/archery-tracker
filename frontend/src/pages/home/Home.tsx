import { Button } from "@/components/ui/button";
import { FlipWords } from "@/components/ui/flip-words";
import { Link } from "react-router-dom";

import Byteark from "@/assets/byteark-logo.png";
import OpenCV from "@/assets/opencv-logo.png";

export const Home = () => {
  return (
    <div className="w-screen h-screen bg-grid-pattern flex justify-center p-8 pt-20">
      <div className="grid grid-cols-2 max-w-[1200px]">
        <div className="flex flex-col">
          <h1 className="text-5xl font-semibold mb-6">
            Precision Training <br />
            For Better <FlipWords words={["Accuracy", "Posture"]} />
          </h1>
          <h2 className="mb-6">
            Access detailed performance data, improve your technique, and track
            your progress like never before.
          </h2>
          <div className="flex gap-4 mb-6">
            <Link to="/trainingSession">
              <Button className="text-xs rounded-2xl" size="lg">
                Start Training
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button
                className="text-xs rounded-2xl"
                size="lg"
                variant="outline"
              >
                See your stats
              </Button>
            </Link>
          </div>
          <div className="flex gap-5">
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
          </div>
        </div>
        <div>
          <div className="border rounded-xl p-2">
            <p>See your stats</p>
            <div className="h-[170px] w-full border rounded-lg mt-2 bg-zinc-900"></div>
          </div>
          <div className="grid grid-cols-2 mt-2 gap-2">
            <div className="border rounded-xl p-2">
              <p>Target Scoring</p>
              <div className="h-[220px] w-full border rounded-lg mt-2 bg-zinc-900"></div>
            </div>
            <div className="border rounded-xl p-2">
              <p>Poseture Tracker</p>
              <div className="h-[220px] w-full border rounded-lg mt-2 bg-zinc-900"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
