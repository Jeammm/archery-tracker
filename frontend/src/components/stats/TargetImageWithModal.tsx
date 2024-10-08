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

interface TargetImageWithModalProps {
  className?: string;
  hit: Hit;
}

export const TargetImageWithModal = (props: TargetImageWithModalProps) => {
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
        <img
          src={hit.target_image_url}
          className="object-cover w-full h-full"
        />
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
                src={hit.target_image_url}
                className="object-cover w-full h-full"
              />
            </div>
            <div>
              <p>Score {hit.score}</p>
              <p>TTS {2004} ms</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
