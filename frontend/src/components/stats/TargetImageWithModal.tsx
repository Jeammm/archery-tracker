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
import { Table, TableBody, TableCell, TableRow } from "../ui/table";
import { format } from "date-fns";
import { TargetImageWithShotOverlay } from "./TargetImageWithShotOverlay";

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
        className={cn(["border cursor-pointer", className])}
        onClick={() => setIsTargetImageModalOpen(true)}
      >
        <img
          src={hit.target_image_url || DEFAULT_IMAGE}
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
            <DialogTitle>Shot result (Target image)</DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <TargetImageWithShotOverlay
              targetImage={hit.target_image_url || DEFAULT_IMAGE}
              hits={[hit]}
            />
            <Table className="border">
              <TableBody>
                <TableRow>
                  <TableCell className="font-semibold">Score</TableCell>
                  <TableCell>{hit.score}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-semibold">TTS</TableCell>
                  <TableCell>{2012} ms</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-semibold">Timestamp</TableCell>
                  <TableCell>{format(hit.hit_time, "hh : mm : ss")}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
