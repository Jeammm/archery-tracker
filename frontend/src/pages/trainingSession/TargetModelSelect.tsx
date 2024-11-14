import { Link, useNavigate } from "react-router-dom";

import { TargetModel } from "@/types/constant";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { BASE_BACKEND_URL } from "@/services/baseUrl";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import { Button, buttonVariants } from "@/components/ui/button";
import { useCallback, useEffect, useState } from "react";
import { CircleHelp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const TargetModelSelect = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [models, setModels] = useState<TargetModel[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const onClickModel = async (modelData: TargetModel) => {
    try {
      const response = await axios.post(
        `${BASE_BACKEND_URL}/sessions`,
        { model: modelData.model },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user?.token || ""}`,
          },
        }
      );

      navigate(`/trainingSession/live/${response.data._id}`);
    } catch (error) {
      console.error(`error selecting target model: ${error}`);
    }
  };

  const fetchModels = useCallback(async () => {
    try {
      const response = await axios.get(`${BASE_BACKEND_URL}/models`, {
        headers: {
          Authorization: `Bearer ${user?.token || ""}`,
        },
      });

      setModels(response.data);
    } catch (error) {
      console.error(`error fetching target model: ${error}`);
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  return (
    <div>
      <h1 className="text-4xl font-bold">Target Model</h1>
      <p className="mt-2 text-muted-foreground">
        Select your target model for this training session
      </p>
      <div className="flex gap-2 text-muted-foreground mt-2 text-sm">
        <p>Missing a model?</p>
        <Link
          to="/models/create"
          className={buttonVariants({ variant: "link", size: "no-space" })}
        >
          Add a new target model
        </Link>
      </div>
      <div className="grid gap-3 grid-cols-1 md:grid-cols-2 mt-6">
        {isLoading
          ? [...Array(4)].map((_, index) => {
              return (
                <div
                  className={cn([
                    "flex border p-4 gap-4 rounded-lg cursor-pointer hover:bg-secondary relative",
                  ])}
                  key={`skeleton-${index}`}
                >
                  <Skeleton className="h-[120px] w-[120px] rounded-md border" />
                  <div className="flex-1">
                    <Skeleton className="h-[22px] w-[150px]" />
                    <Skeleton className="mt-2 h-[28px] w-full" />
                    <Skeleton className="mt-2 h-[20px] w-[100px]" />
                    <Skeleton className="mt-2 h-[20px] w-[150px]" />
                  </div>
                </div>
              );
            })
          : models.map((model) => {
              return (
                <div
                  className={cn([
                    "flex border p-4 gap-4 rounded-lg cursor-pointer hover:bg-secondary relative",
                  ])}
                  onClick={() => onClickModel(model)}
                  key={model.model}
                >
                  <img
                    src={model.model_path}
                    alt={model.model}
                    className="object-cover h-[120px] aspect-square rounded-md"
                  />
                  <div className="flex-1">
                    <div className="flex justify-between w-full">
                      <Badge>
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        <p className="ml-2.5">Olympic Standard</p>
                      </Badge>
                      <Button
                        variant="ghost"
                        size="no-space"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/models/${model.model}`);
                        }}
                      >
                        <CircleHelp
                          size={18}
                          className="text-muted-foreground"
                        />
                      </Button>
                    </div>
                    <p className="text-lg font-semibold mt-2">
                      {model.model_name}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      Rings: {model.rings_amount}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      Bullseye:{" "}
                      {`[X: ${model.bullseye_point[0]}, Y: ${model.bullseye_point[1]}]`}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      Created By: {model.created_by}
                    </p>
                  </div>
                </div>
              );
            })}
      </div>
    </div>
  );
};
