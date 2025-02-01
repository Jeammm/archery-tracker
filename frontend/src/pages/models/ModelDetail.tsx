import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { BASE_BACKEND_URL } from "@/services/baseUrl";
import { TargetModel } from "@/types/constant";
import axios from "axios";
import { Copy, Pencil } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { TargetBullseyeCanvasOverlay } from "./TargetBullseyeCanvasOverlay";
import { ManageModelSkeleton } from "@/components/model/ManageModel";
import { Loader } from "@/components/ui/loader";
import { toast } from "@/hooks/use-toast";

export const ModelDetail = () => {
  const { user } = useAuth();
  const { modelName } = useParams();
  const [modelData, setModelData] = useState<TargetModel | null>(null);
  const [canvasSignal, setCanvasSignal] = useState<number>(0);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);

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

  const onClickCopyModel = () => {
    navigator.clipboard.writeText(`
model_data = {
  "model_path": "${modelData?.model_path}",
  "bullseye_point": [${modelData?.bullseye_point[0]}, ${modelData?.bullseye_point[1]}],
  "inner_diameter_px": ${modelData?.inner_diameter_px},
  "inner_diameter_inch": 1.5,
  "rings_amount": ${modelData?.rings_amount},
}
`);

    toast({ title: "Model data copied to clipboard", variant: "success" });
  };

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

      <div className="mt-6 border p-4 rounded-md">
        <div className="flex justify-between">
          <p className="text-3xl font-semibold mb-4 text-center md:text-start">
            Model : {modelData.model_name}
          </p>
          <Button variant="ghost" onClick={onClickCopyModel}>
            <Copy />
          </Button>
        </div>

        <div className="flex gap-3 flex-col md:flex-row items-center md:items-start">
          <div className="border rounded-md w-96 shrink-0 overflow-hidden relative select-none">
            {!imageLoaded && (
              <Loader className="w-full aspect-square h-auto flex justify-center items-center" />
            )}
            <img
              alt="preview target"
              src={modelData.model_path}
              onLoad={() => {
                setCanvasSignal((prev) => prev + 1);
                setImageLoaded(true);
              }}
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

          <div className="flex flex-col gap-6 flex-1">
            <div className="flex flex-col gap-1.5">
              <p className="font-bold">Bullseye Point</p>
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
              <p className="text-muted-foreground text-xs leading-none">
                The center point of the target.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <p className="font-bold">Inner Diameter</p>
              <div className="flex gap-3">
                <Input
                  type="number"
                  value={modelData.inner_diameter_px}
                  readOnly
                />
              </div>
              <p className="text-muted-foreground text-xs leading-none">
                The inner ring size of the target.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <p className="font-bold">Rings Amount</p>
              <div className="flex gap-3">
                <Input
                  type="text"
                  value={modelData.rings_amount}
                  className="flex-1"
                  readOnly
                />
              </div>
              <p className="text-muted-foreground text-xs leading-none">
                The amount of ring in this target.
              </p>
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
    </div>
  );
};
