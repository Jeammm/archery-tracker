import { cn } from "@/lib/utils";
import "./CountDownOverlay.css";

export const CountDownOverlay = () => {
  return (
    <div className="fixed h-screen w-screen top-0 left-0 flex justify-center items-center z-[1000] bg-black/50 backdrop-blur-md">
      <div className="timer text-white"></div>
    </div>
  );
};

export const CountDownComponent = ({ className }: { className?: string }) => {
  return (
    <div
      className={cn([
        "flex justify-center items-center z-[1000] bg-black/50 backdrop-blur-md",
        className,
      ])}
    >
      <div className="timer-small"></div>
    </div>
  );
};
