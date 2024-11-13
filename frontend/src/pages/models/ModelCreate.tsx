import axios from "axios";
import { BASE_BACKEND_URL } from "@/services/baseUrl";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Link, useNavigate } from "react-router-dom";
import { ManageModel } from "@/components/model/ManageModel";

import GoodExample from "/olympic_standard_target.jpg";
import BadExample from "/bad_example.jpeg";

export const ModelCreate = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const onClickSubmitTargetData = async (
    targetImageFile: File | null,
    modelName: string,
    innerDiameter: number,
    ringsAmount: number,
    bullseyePoint: { x: number; y: number }
  ) => {
    if (!targetImageFile || !modelName || !innerDiameter || !ringsAmount) {
      return;
    }

    try {
      const formData = new FormData();
      formData.append("image", targetImageFile);
      formData.append("modelName", modelName);
      formData.append("bullseyePointX", String(bullseyePoint.x));
      formData.append("bullseyePointY", String(bullseyePoint.y));
      formData.append("innerDiameter", String(innerDiameter));
      formData.append("ringsAmount", String(ringsAmount));

      await axios.post(`${BASE_BACKEND_URL}/models`, formData, {
        headers: {
          Authorization: `Bearer ${user?.token || ""}`,
          "Content-Type": "multipart/form-data",
        },
      });

      toast({
        title: "Add new target model successfully!",
        description: "Your target model has been added to the list.",
        variant: "success",
      });
      navigate("/trainingSession");
    } catch (error) {
      toast({
        title: "Add new target model failed",
        description: `Error: ${error}, please try again`,
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <ManageModel isCreatePage onSubmit={onClickSubmitTargetData} />
      <div className="rounded-md border mt-4 p-4">
        <div className="flex gap-4 ">
          <div>
            <h2 className="text-xl font-semibold">
              Suitable image for target model
            </h2>
            <p className="mt-2 text-sm">
              For the best results, please ensure that the image is perfectly
              aligned in perspective. The model should be captured straight from
              above, with no tilt or angle, to ensure accurate processing.
              Misalignment or skewed images may lead to suboptimal outcomes.
            </p>
          </div>
          <div className="p-2 flex flex-col justify-center items-center border rounded-sm h-fit">
            <div className="size-32 rounded-sm mb-1 overflow-hidden object-cover">
              <img
                src={GoodExample}
                alt="good example"
                className="w-full h-full"
              />
            </div>
            <p>✅ Good Image</p>
          </div>
          <div className="p-2 flex flex-col justify-center items-center border rounded-sm h-fit">
            <div className="size-32 rounded-sm mb-1 overflow-hidden object-cover">
              <img
                src={BadExample}
                alt="bad example"
                className="w-full h-full"
              />
            </div>
            <p>❌ Bad Image</p>
          </div>
        </div>
        <div className="mt-2">
          <p className="mt-1 text-sm">
            <Link
              to="https://photokit.com/tools/warp/perspective/"
              className="text-blue-700 underline"
              target="_blank"
            >
              Perspective tools
            </Link>{" "}
            is a one great way to prepare the image before use as target model
          </p>
        </div>
      </div>
    </>
  );
};
