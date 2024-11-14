import {
  ManageModel,
  ManageModelSkeleton,
} from "@/components/model/ManageModel";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";
import { BASE_BACKEND_URL } from "@/services/baseUrl";
import { TargetModel } from "@/types/constant";
import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

export const ModelEdit = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { modelName } = useParams();
  const [modelData, setModelData] = useState<TargetModel | null>(null);

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

  const onClickUpdateTargetModel = async (
    modelId: string,
    modelName: string,
    innerDiameter: number,
    ringsAmount: number,
    bullseyePoint: { x: number; y: number },
    callbackFn: () => void
  ) => {
    if (!modelName || !innerDiameter || !ringsAmount) {
      return;
    }
    try {
      const formData = new FormData();
      formData.append("modelName", modelName);
      formData.append("bullseyePointX", String(bullseyePoint.x));
      formData.append("bullseyePointY", String(bullseyePoint.y));
      formData.append("innerDiameter", String(innerDiameter));
      formData.append("ringsAmount", String(ringsAmount));

      await axios.patch(`${BASE_BACKEND_URL}/models/${modelId}`, formData, {
        headers: {
          Authorization: `Bearer ${user?.token || ""}`,
          "Content-Type": "multipart/form-data",
        },
      });

      toast({
        title: "Update target model successfully!",
        description: "Your target model has been updated.",
        variant: "success",
      });
      navigate("/trainingSession");
    } catch (error) {
      toast({
        title: "Update target model failed",
        description: `Error: ${error}, please try again`,
        variant: "destructive",
      });
    } finally {
      callbackFn();
    }
  };

  useEffect(() => {
    fetchModelData();
  }, [fetchModelData]);

  if (!modelData) {
    return <ManageModelSkeleton />;
  }

  return (
    <ManageModel modelData={modelData} onUpdate={onClickUpdateTargetModel} />
  );
};
