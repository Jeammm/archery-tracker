import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { BASE_BACKEND_URL } from "@/services/baseUrl";
import { TargetModel } from "@/types/constant";
import axios from "axios";
import { Pencil } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { TargetBullseyeCanvasOverlay } from "./TargetBullseyeCanvasOverlay";
import { ManageModelSkeleton } from "@/components/model/ManageModel";

export const ModelDetail = () => {
  const { user } = useAuth();
  const { modelName } = useParams();
  const [modelData, setModelData] = useState<TargetModel | null>(null);
  const [canvasSignal, setCanvasSignal] = useState<number>(0);

  const fetchModelData = useCallback(async () => {
    try {
      const response = await axios.get<TargetModel>(
        `${BASE_BACKEND_URL}/models/${modelName}`,
        {
          headers: {
            Authorization: `Bearer ${user?.token || ""}`,
          },
        }
      );
      setModelData(response.data);
    } catch (error) {
      console.error(`error fetching model data ${error}`);
    }
  }, [modelName, user?.token]);

  useEffect(() => {
    fetchModelData();
  }, [fetchModelData]);

  useEffect(() => {
    setTimeout(() => {
      setCanvasSignal((prev) => prev + 1);
    }, 100);
  }, [modelData]);

  if (!modelData) {
    return <ManageModelSkeleton />;
  }

  return (
    <div>
      <h1 className="text-4xl font-bold">Target Model Detail</h1>
      <p className="mt-2 text-muted-foreground">
        Target model data availabled for training sessions
      </p>

      <div className="flex gap-3 mt-6 flex-col md:flex-row items-center md:items-start">
        <div className="border rounded-md w-96 shrink-0 overflow-hidden relative select-none">
          <img
            alt="preview target"
            src={modelData.model_path}
            onLoad={() => setCanvasSignal((prev) => prev + 1)}
            className="w-full h-full"
          />
          <TargetBullseyeCanvasOverlay
            bullseyePoint={{
              x: modelData.bullseye_point[0],
              y: modelData.bullseye_point[1],
            }}
            innerDiameter={modelData.inner_diameter_px}
            ringsAmount={modelData.rings_amount}
            targetImageSize={{
              x: modelData.model_size[0],
              y: modelData.model_size[1],
            }}
            canvasSignal={canvasSignal}
          />
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <p className="text-3xl">{modelData.model_name}</p>
          </div>

          <div className="flex flex-col gap-2">
            <p>Bullseye Point</p>
            <div className="flex gap-3">
              <div className="flex gap-3 items-center flex-1">
                <p className="shrink-0">X :</p>
                <Input
                  type="number"
                  value={modelData.bullseye_point[0]}
                  readOnly
                />
                <p className="shrink-0">Y :</p>
                <Input
                  type="number"
                  value={modelData.bullseye_point[1]}
                  readOnly
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p>Inner Diameter</p>
            <div className="flex gap-3">
              <Input
                type="number"
                value={modelData.inner_diameter_px}
                readOnly
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p>Rings Amount</p>
            <div className="flex gap-3">
              <Input
                type="text"
                value={modelData.rings_amount}
                className="flex-1"
                readOnly
              />
            </div>
          </div>

          <Link
            to={`edit`}
            replace
            className={buttonVariants({
              variant: "default",
              className: "w-fit",
            })}
          >
            <div className="flex justify-center items-center gap-2">
              <Pencil size={18} />
              <p>Edit This Model</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};
