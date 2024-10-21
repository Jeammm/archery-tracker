import { BodyFeatures } from "@/types/skeleton";

interface SkeletonFeatureProps {
  features?: BodyFeatures;
}

export const SkeletonFeature = (props: SkeletonFeatureProps) => {
  const { features } = props;

  return (
    <div className="grid grid-cols-2 gap-x-4">
      <div>
        <p>Spine {features?.spine_angle?.toFixed(2)}°</p>
        <p>Left shoulder {features?.bow_shoulder_angle?.toFixed(2)}°</p>
        <p>Left elbow {features?.bow_arm_elbow_angle?.toFixed(2)}°</p>
        <p>Left wrist {features?.bow_wrist_angle?.toFixed(2)}°</p>
        <p>Left leg {features?.left_knee_angle?.toFixed(2)}°</p>
      </div>

      <div>
        <p>Hip {features?.hip_angle?.toFixed(2)}°</p>
        <p>Right shoulder {features?.drawing_shoulder_angle?.toFixed(2)}°</p>
        <p>Right elbow {features?.drawing_arm_elbow_angle?.toFixed(2)}°</p>
        <p>Right wrist {features?.drawing_wrist_angle?.toFixed(2)}°</p>
        <p>Right leg {features?.right_knee_angle?.toFixed(2)}°</p>
      </div>
    </div>
  );
};
