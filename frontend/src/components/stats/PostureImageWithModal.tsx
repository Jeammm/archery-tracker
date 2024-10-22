import { cn } from "@/lib/utils";
import { Hit } from "@/types/session";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import DEFAULT_IMAGE from "/placeholder-image.jpg";
import { SkeletonFeature } from "./SkeletonFeature";

interface PostureImageWithModalProps {
  className?: string;
  hit: Hit;
}

export const PostureImageWithModal = (props: PostureImageWithModalProps) => {
  const { className, hit } = props;

  const [isTargetImageModalOpen, setIsTargetImageModalOpen] =
    useState<boolean>(false);

  return (
    <>
      <div
        className={cn(["border cursor-pointer", className])}
        onClick={() => setIsTargetImageModalOpen(true)}
      >
        <img
          src={hit.pose_image_url || DEFAULT_IMAGE}
          className="object-cover w-full h-full"
        />
      </div>
      <Dialog
        open={isTargetImageModalOpen}
        onOpenChange={setIsTargetImageModalOpen}
        modal
      >
        <DialogContent className="max-w-[80vw]">
          <DialogHeader>
            <DialogTitle>Shot result (Posture image)</DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <div className={cn(["w-full border object-fill cursor-pointer"])}>
              <img
                src={hit.pose_image_url || DEFAULT_IMAGE}
                className="object-cover w-full h-full"
              />
            </div>
            <SkeletonFeature features={hit.features} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
