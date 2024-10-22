import { BodyFeatures } from "@/types/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";

interface SkeletonFeatureProps {
  features?: BodyFeatures;
}

const formatAngle = (angle: number | undefined) => {
  if (angle) {
    return `${angle.toFixed(2)}°`;
  } else {
    return "-";
  }
};

export const SkeletonFeature = (props: SkeletonFeatureProps) => {
  const { features } = props;

  return (
    <Table className="border [&>*>*>td]:border">
      <TableHeader className="text-center hover:bg-muted/50 group/multirow font-bold">
        <TableRow>
          <TableCell rowSpan={2}>Joint</TableCell>
          <TableCell colSpan={2}>Angle</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Left</TableCell>
          <TableCell>Right</TableCell>
        </TableRow>
      </TableHeader>

      <TableBody className="text-center">
        <TableRow>
          <TableCell className="font-semibold">Spine</TableCell>
          <TableCell colSpan={2}>
            {formatAngle(features?.spine_angle)}
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-semibold">Shoulder</TableCell>
          <TableCell>{formatAngle(features?.bow_shoulder_angle)}</TableCell>
          <TableCell>{formatAngle(features?.drawing_shoulder_angle)}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-semibold">Elbow</TableCell>
          <TableCell>{formatAngle(features?.bow_arm_elbow_angle)}</TableCell>
          <TableCell>
            {formatAngle(features?.drawing_arm_elbow_angle)}
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-semibold">Wrist</TableCell>
          <TableCell>{formatAngle(features?.bow_wrist_angle)}</TableCell>
          <TableCell>{formatAngle(features?.drawing_wrist_angle)}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-semibold">Hip</TableCell>
          <TableCell colSpan={2}>{formatAngle(features?.hip_angle)}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-semibold">Leg</TableCell>
          <TableCell>{formatAngle(features?.left_knee_angle)}</TableCell>
          <TableCell>{formatAngle(features?.right_knee_angle)}</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
};
