import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";
import { BASE_BACKEND_URL } from "@/services/baseUrl";
import { SetStateActionType } from "@/types/constant";
import { Hit } from "@/types/session";
import axios from "axios";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";

interface DeleteShotModalProps {
  isDeleteShotModalOpen: boolean;
  setIsDeleteShotModalOpen: SetStateActionType<boolean>;
  hit: Hit | null;
  roundId: string;
  fetchSessionData: () => void;
}

export const DeleteShotModal = (props: DeleteShotModalProps) => {
  const { user } = useAuth();

  const {
    hit,
    setIsDeleteShotModalOpen,
    isDeleteShotModalOpen,
    roundId,
    fetchSessionData,
  } = props;

  const submitDeleteShot = async () => {
    if (!hit) {
      return;
    }
    try {
      await axios.delete(
        `${BASE_BACKEND_URL}/delete-shot/${roundId}/${hit.id}`,
        {
          headers: {
            Authorization: `Bearer ${user?.token || ""}`,
          },
        }
      );
      toast({
        title: "Remove shot data successfully!",
        description: "Your shot detail has been removed.",
        variant: "success",
      });
      fetchSessionData();
    } catch (error) {
      toast({
        title: "Remove shot data Failed",
        description: `Error: ${error}`,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog
      modal
      open={isDeleteShotModalOpen}
      onOpenChange={setIsDeleteShotModalOpen}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove Wrong Shot</DialogTitle>
          <DialogDescription>
            Are you ssure you want to remove this shot?
          </DialogDescription>
        </DialogHeader>
        <div className="ml-auto flex gap-2 flex-col xs:flex-row">
          <DialogClose className="w-fit mt-4" asChild>
            <Button variant="secondary">Cancel</Button>
          </DialogClose>
          <DialogClose className="w-fit mt-4" asChild>
            <Button onClick={submitDeleteShot}>Remove</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
};
