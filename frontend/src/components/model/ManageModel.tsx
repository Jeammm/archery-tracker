import {
  CanvasMode,
  TargetBullseyeCanvasOverlay,
} from "@/pages/models/TargetBullseyeCanvasOverlay";
import { TargetModel, XYRelation } from "@/types/constant";
import { Crosshair, ImageUp, LocateFixed, Minus, Plus } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Input } from "../ui/input";
import { Button, buttonVariants } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import { Loader } from "../ui/loader";
import { cn } from "@/lib/utils";

interface ManageModelProps {
  modelData?: TargetModel | null;
  isCreatePage?: boolean;
  onUpdate?: (
    modelId: string,
    modelName: string,
    innerDiameter: number,
    ringsAmount: number,
    bullseyePoint: { x: number; y: number },
    callbackFn: () => void
  ) => Promise<void>;
  onSubmit?: (
    targetImageFile: File | null,
    modelName: string,
    innerDiameter: number,
    ringsAmount: number,
    bullseyePoint: {
      x: number;
      y: number;
    },
    callbackFn: () => void
  ) => Promise<void>;
}

export const ManageModel = (props: ManageModelProps) => {
  const { modelData, isCreatePage, onUpdate, onSubmit } = props;

  const [targetImage, setTargetImage] = useState<string | null>(null);
  const [targetImageFile, setTargetImageFile] = useState<File | null>(null);
  const [targetImageSize, setTargetImageSize] = useState<XYRelation | null>(
    null
  );

  const [modelName, setModelName] = useState<string>("");
  const [bullseyePoint, setBullseyePoint] = useState<XYRelation>({
    x: 1,
    y: 1,
  });
  const [innerDiameter, setInnerDiameter] = useState<number>(100);
  const [ringsAmount, setRingAmounts] = useState<number>(6);

  const [canvasMode, setCanvasMode] = useState<CanvasMode>("idle");
  const [canvasSignal, setCanvasSignal] = useState<number>(0);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const onTargetImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const imageUrl = URL.createObjectURL(event.target.files[0]);
      setTargetImage(imageUrl);
      setTargetImageFile(event.target.files[0]);

      const img = new Image();
      img.src = imageUrl;
      img.onload = () => {
        const width = img.naturalWidth;
        const height = img.naturalHeight;
        setTargetImageSize({ x: width, y: height });
        setBullseyePoint({
          x: Math.floor(width / 2),
          y: Math.floor(height / 2),
        });
      };
    }
  };

  const onChangeRingsAmount = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value);
    if (!isNaN(value) && value > 0) {
      setRingAmounts(value);
    }
  };

  const onClickSetRingsAmount = (isPlus: boolean) => {
    if (isPlus) {
      setRingAmounts((prev) => prev + 1);
    } else if (ringsAmount > 1) {
      setRingAmounts((prev) => prev - 1);
    }
  };

  const onClickSave = () => {
    setIsSubmitting(true);
    if (isCreatePage && onSubmit) {
      onSubmit(
        targetImageFile,
        modelName,
        innerDiameter,
        ringsAmount,
        bullseyePoint,
        () => setIsSubmitting(false)
      );
    } else if (onUpdate && modelData) {
      onUpdate(
        modelData._id,
        modelName,
        innerDiameter,
        ringsAmount,
        bullseyePoint,
        () => setIsSubmitting(false)
      );
    }
  };

  useEffect(() => {
    if (!isCreatePage && modelData) {
      setTargetImage(modelData.model_path);
      setTargetImageSize({
        x: modelData.model_size[0],
        y: modelData.model_size[1],
      });
      setModelName(modelData.model_name);
      setBullseyePoint({
        x: modelData.bullseye_point[0],
        y: modelData.bullseye_point[1],
      });
      setInnerDiameter(modelData.inner_diameter_px);
      setRingAmounts(modelData.rings_amount);

      setTimeout(() => {
        setCanvasSignal((prev) => prev + 1); // Signal canvas to re-draw again on image load
      }, 100);
    }
  }, [isCreatePage, modelData]);

  return (
    <div>
      <h1 className="text-4xl font-bold">
        {isCreatePage ? "Add New Target Model" : "Edit Target Model"}
      </h1>
      <p className="mt-2 text-muted-foreground">
        {isCreatePage
          ? "Upload new target and fill the data form"
          : "Adjust model bullseye point, rings, and diameter"}
      </p>

      <div className="mt-6 border p-4 rounded-md">
        <div className="flex gap-2 mb-4 font-semibold text-3xl items-center">
          <p className="shrink-0">Model : </p>
          <input
            type="text"
            value={modelName}
            onChange={(event) => setModelName(event.target.value)}
            className="w-full bg-secondary/40 p-1.5 px-2.5 rounded-sm"
            placeholder="Model name..."
          />
        </div>

        <div className="flex gap-4 flex-col md:flex-row items-center md:items-start">
          <div
            className={cn([
              "border rounded-md  w-96 shrink-0 overflow-hidden relative select-none",
              targetImage ? "" : "min-h-96",
            ])}
          >
            {targetImage && targetImageSize ? (
              <>
                <img
                  alt="preview target"
                  src={targetImage}
                  onLoad={() => setCanvasSignal((prev) => prev + 1)}
                  className="w-full h-full"
                />
                <TargetBullseyeCanvasOverlay
                  bullseyePoint={bullseyePoint}
                  setBullseyePoint={setBullseyePoint}
                  innerDiameter={innerDiameter}
                  setInnerDiameter={setInnerDiameter}
                  ringsAmount={ringsAmount}
                  canvasMode={canvasMode}
                  setCanvasMode={setCanvasMode}
                  targetImageSize={targetImageSize}
                  canvasSignal={canvasSignal}
                />
              </>
            ) : (
              <div className="w-full h-96 flex flex-col justify-center items-center">
                <label htmlFor="image-input-field" className="cursor-pointer">
                  <ImageUp
                    className="mx-auto p-2 border rounded-sm size-10 mb-2"
                    strokeWidth={1.8}
                  />
                  <p className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm">
                    Select Target Image
                  </p>
                </label>
                <input
                  id="image-input-field"
                  type="file"
                  onChange={onTargetImageChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-6 md:flex-1">
            <div className="flex flex-col gap-1.5 mt-2">
              <p className="font-bold">Bullseye Point</p>
              <div className="flex gap-3">
                <div className="flex gap-3 items-center flex-1">
                  <p className="shrink-0">X :</p>
                  <Input
                    type="number"
                    value={bullseyePoint.x}
                    readOnly
                    className=""
                  />
                  <p className="shrink-0">Y :</p>
                  <Input
                    type="number"
                    value={bullseyePoint.y}
                    readOnly
                    className=""
                  />
                </div>
                <Button
                  onClick={() => {
                    if (canvasMode === "bullseye") {
                      setCanvasMode("idle");
                    } else {
                      setCanvasMode("bullseye");
                    }
                  }}
                  data-state={canvasMode === "bullseye" ? "selected" : ""}
                >
                  <LocateFixed />
                </Button>
              </div>
              <p className="text-muted-foreground text-xs leading-none">
                The center point of the target.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <p className="font-bold">Inner Diameter</p>
              <div className="flex gap-3">
                <Input type="number" value={innerDiameter} readOnly />
                <Button
                  onClick={() => {
                    if (canvasMode === "diameter") {
                      setCanvasMode("idle");
                    } else {
                      setCanvasMode("diameter");
                    }
                  }}
                  data-state={canvasMode === "diameter" ? "selected" : ""}
                >
                  <Crosshair />
                </Button>
              </div>
              <p className="text-muted-foreground text-xs leading-none">
                The inner ring size of the target.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <p className="font-bold">Rings Amount</p>
              <div className="flex gap-3">
                <Button onClick={() => onClickSetRingsAmount(false)}>
                  <Minus />
                </Button>
                <Input
                  type="text"
                  value={ringsAmount}
                  onChange={onChangeRingsAmount}
                  className="flex-1"
                />
                <Button onClick={() => onClickSetRingsAmount(true)}>
                  <Plus />
                </Button>
              </div>
              <p className="text-muted-foreground text-xs leading-none">
                The amount of ring in this target.
              </p>
            </div>

            <Button
              className="w-full"
              onClick={onClickSave}
              disabled={
                !modelName ||
                !innerDiameter ||
                !ringsAmount ||
                !targetImage ||
                isSubmitting
              }
            >
              {isSubmitting ? <Loader /> : "Submit"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ManageModelSkeleton = () => {
  return (
    <div>
      <h1 className="text-4xl font-bold">Target Model Detail</h1>
      <p className="mt-2 text-muted-foreground">
        Target model data availabled for training sessions
      </p>

      <div className="mt-6 border p-4 rounded-md">
        <div className="flex gap-2 mb-4">
          <p className="text-3xl font-semibold">Model : </p>
          <Skeleton className="h-[36px] w-[400px]" />
        </div>

        <div className="flex gap-3 flex-col md:flex-row items-center md:items-start">
          <div className="border rounded-md min-h-96 w-96 shrink-0 overflow-hidden relative select-none flex justify-center items-center">
            <Loader containerClassName="w-full h-full" spinnerSize="md" />
          </div>

          <div className="flex flex-col gap-6 flex-1">
            <div className="flex flex-col gap-1.5">
              <p className="font-semibold">Bullseye Point</p>
              <div className="flex gap-3">
                <div className="flex gap-3 items-center flex-1">
                  <p className="shrink-0">X :</p>
                  <Skeleton className="h-[36px] flex-1" />
                  <p className="shrink-0">Y :</p>
                  <Skeleton className="h-[36px] flex-1" />
                </div>
              </div>
              <Skeleton className="h-[12px] w-[180px]" />
            </div>

            <div className="flex flex-col gap-1.5">
              <p className="font-semibold">Inner Diameter</p>
              <Skeleton className="h-[36px]" />
              <Skeleton className="h-[12px] w-[180px]" />
            </div>

            <div className="flex flex-col gap-1.5">
              <p className="font-semibold">Rings Amount</p>
              <Skeleton className="h-[36px]" />
              <Skeleton className="h-[12px] w-[180px]" />
            </div>

            <div
              className={buttonVariants({
                variant: "default",
                className: "w-fit",
              })}
            >
              <Loader />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
