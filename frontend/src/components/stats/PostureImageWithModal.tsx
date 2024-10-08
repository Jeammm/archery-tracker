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
        className={cn([
          "w-[200px] aspect-square border cursor-pointer",
          className,
        ])}
        onClick={() => setIsTargetImageModalOpen(true)}
      >
        <img src={hit.pose_image_url} className="object-cover w-full h-full" />
      </div>
      <Dialog
        open={isTargetImageModalOpen}
        onOpenChange={setIsTargetImageModalOpen}
        modal
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Shot result (Target image)</DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <div
              className={cn([
                "w-full aspect-square border object-fill cursor-pointer",
              ])}
            >
              <img
                src={hit.pose_image_url}
                className="object-cover w-full h-full"
              />
            </div>
            <div className="flex flex-col gap-2">
              <p>Head {90}°</p>
              <p>Hip {90}°</p>
              <div>
                <p>Shoulders</p>
                <div className="flex justify-between gap-4">
                  <p>Left {91}°</p>
                  <p>Right {91}°</p>
                </div>
              </div>

              <div>
                <p>Elbows</p>
                <div className="flex justify-between gap-4">
                  <p>Left {91}°</p>
                  <p>Right {91}°</p>
                </div>
              </div>

              <div>
                <p>Legs</p>
                <div className="flex justify-between gap-4">
                  <p>Left {91}°</p>
                  <p>Right {91}°</p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
