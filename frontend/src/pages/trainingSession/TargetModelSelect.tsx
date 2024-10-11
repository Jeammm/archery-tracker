import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { modelChoices, TargetModel } from "@/types/constant";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { BASE_BACKEND_URL } from "@/services/baseUrl";
import useFetch from "react-fetch-hook";
import { useAuth } from "@/context/AuthContext";
import { Session } from "@/types/session";
import { Loader } from "@/components/ui/loader";

export const TargetModelSelect = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [selectedModel, setSelectedModel] = useState<TargetModel | null>(null);

  const { isLoading, error, data } = useFetch(`${BASE_BACKEND_URL}/sessions`, {
    depends: [selectedModel],
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${user?.token || ""}`,
    },
    body: JSON.stringify({ model: selectedModel?.model }),
  });

  const onClickModel = (modelData: TargetModel) => {
    setSelectedModel(modelData);
  };

  useEffect(() => {
    const session = data as Session | undefined;
    if (session && session._id) {
      navigate(`/trainingSession/live/${session._id}`);
    }
  }, [data, navigate]);

  useEffect(() => {
    if (error) {
      setSelectedModel(null);
    }
  }, [error]);

  return (
    <div>
      <h1 className="text-4xl font-bold">Target Model</h1>
      <p className="mt-2 text-muted-foreground">
        Select your target model for this training session
      </p>
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 mt-6">
        {modelChoices.map((model) => {
          return (
            <div
              className={cn([
                "flex border p-4 gap-4 rounded-lg cursor-pointer hover:bg-slate-900 relative",
              ])}
              onClick={() => onClickModel(model)}
              key={model.model}
            >
              {isLoading && (
                <div className="absolute w-full h-full left-0 top-0 bg-white/50">
                  <Loader>
                    <></>
                  </Loader>
                </div>
              )}
              <img
                src={model.model_path}
                alt={model.model}
                className="object-cover h-[120px] aspect-square rounded-md"
              />
              <div>
                <Badge>
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  <p className="ml-2.5">Olympic Standard</p>
                </Badge>
                <p className="text-lg font-semibold mt-2">{model.model_name}</p>
                <p className="text-muted-foreground text-sm">
                  Rings: {model.rings_amount}
                </p>
                <p className="text-muted-foreground text-sm">
                  Bullseye:{" "}
                  {`[X: ${model.bullseye_point[0]}, Y: ${model.bullseye_point[1]}]`}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
