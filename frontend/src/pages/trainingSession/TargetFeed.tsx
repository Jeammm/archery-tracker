import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import TargetScoring from "@/components/TatgetCapture";
import { socket } from "@/services/socket";
import { modelChoices } from "@/types/constant";

export const TargetFeed = () => {
  const { modelId } = useParams();

  const [isModelReady, setIsModelReady] = useState<boolean>(true);

  const selectedModel = useMemo(() => {
    return modelChoices.find((model) => model.model === modelId);
  }, [modelId]);

  useEffect(() => {
    socket.on("target_scores_error", (error) => {
      if (error.message === "'NoneType' object has no attribute 'analyze'") {
        setIsModelReady(false);
        socket.emit("initialize_target_processor", selectedModel);
      }
    });

    socket.on("target_processor_ready", () => {
      setIsModelReady(true);
    });
  }, []);

  return (
    <div>
      <h1>Target Capture</h1>
      <TargetScoring isModelReady={isModelReady} />
    </div>
  );
};
