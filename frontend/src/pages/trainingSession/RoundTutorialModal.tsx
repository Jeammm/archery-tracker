import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { SetStateActionType } from "@/types/constant";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

import AllowCameraPC from "@/assets/tutorial/allow_camera_pc.png";
import AllowCameraIOS from "@/assets/tutorial/allow_camera_ios.jpg";
import ScanWithMobile from "@/assets/tutorial/scan_with_mobile.png";
import PlaceMobileInPlace from "@/assets/tutorial/place_mobile_in_place.png";
import StandInPlace from "@/assets/tutorial/stand_in_place.png";
import RaiseToStart from "@/assets/tutorial/raise_to_start.png";
import RaiseToStop from "@/assets/tutorial/raise_to_stop.png";
import RecordingStart from "@/assets/tutorial/recording_start.png";
import RecordingStop from "@/assets/tutorial/recording_stop.png";
import EndButton from "@/assets/tutorial/end_button.png";
import ResultExample from "@/assets/tutorial/result_example.png";
import { CountDownComponent } from "@/components/countdown/CountDownOverlay";

interface RoundTutorialModalProps {
  isTutorialManualOpen: boolean;
  setIsTutorialManualOpen: SetStateActionType<boolean>;
}

const PAGES_COUNT = 8;

export const RoundTutorialModal = (props: RoundTutorialModalProps) => {
  const { isTutorialManualOpen, setIsTutorialManualOpen } = props;

  const [isTutorialModalOpen, setIsTutorialModalOpen] =
    useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const { doNotShowTutorialModal, onClickDoNotShowTutorialModal } = useAuth();

  const [isNotShowChecked, setIsNotShowChecked] = useState<boolean>(false);

  const [isFirstTime, setIsFirstTime] = useState<boolean>(true);

  const onClickPreviousPage = () => {
    if (currentPage !== 0) {
      setCurrentPage((prev) => prev - 1);
    }
  };
  const onClickNextPage = () => {
    if (currentPage < PAGES_COUNT - 1) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const onModalOpenChange = (
    open: boolean,
    forceNotShowAgain: boolean = false
  ) => {
    setIsTutorialModalOpen(open);
    if (!open) {
      onClickDoNotShowTutorialModal(isNotShowChecked || forceNotShowAgain);
      setIsTutorialManualOpen(open);
      setTimeout(() => {
        setCurrentPage(0);
      }, 200);
    }
  };

  useEffect(() => {
    if (isFirstTime) {
      setIsTutorialModalOpen(!doNotShowTutorialModal);
      setIsNotShowChecked(doNotShowTutorialModal);
      setIsFirstTime(false);
    }
  }, [doNotShowTutorialModal, isFirstTime]);

  return (
    <Dialog
      open={isTutorialModalOpen || isTutorialManualOpen}
      onOpenChange={onModalOpenChange}
      modal
    >
      <DialogContent className="max-w-[min(1000px,85%)] h-[85%] flex flex-col">
        <DialogHeader>
          <DialogTitle>How to start</DialogTitle>
          <DialogDescription>
            Simple guide to help you through easy steps to get started!
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2 flex-1">
          {currentPage === 0 && (
            <div className="flex flex-col">
              <div className="flex-1 flex gap-2 w-full border rounded-md overflow-hidden">
                <img
                  src={AllowCameraPC}
                  alt="allow camera pc"
                  className="w-1/2 object-contain"
                />
                <img
                  src={AllowCameraIOS}
                  alt="allow camera ios"
                  className="w-1/2 object-contain"
                />
              </div>
              <h3>Step 1. Allow camera usage request</h3>
              <p>
                Archery tracker use your devices camera in order to record and
                store your training video
              </p>
            </div>
          )}
          {currentPage === 1 && (
            <div className="flex flex-col">
              <div className="flex-1 flex gap-2 w-full border rounded-md overflow-hidden">
                <img
                  src={ScanWithMobile}
                  alt="scan with mobile"
                  className="w-full object-contain"
                />
              </div>
              <h3>Step 2. Connect you 2nd camera by scanning QR code</h3>
              <p>Scan QR code with your mobile phone to use as a 2nd camera.</p>
            </div>
          )}
          {currentPage === 2 && (
            <div className="flex flex-col">
              <div className="flex-1 flex gap-2 w-full border rounded-md overflow-hidden">
                <img
                  src={PlaceMobileInPlace}
                  alt="place mobile in place"
                  className="max-h-[560px] object-contain"
                />
              </div>
              <h3>Step 3. Put your mobile phone in place</h3>
              <p>
                Your mobile phone will be used as target camera feed. make sure
                your phone is held tight and see target clearly
              </p>
            </div>
          )}
          {currentPage === 3 && (
            <div className="flex flex-col">
              <div className="flex-1 flex gap-2 w-full border rounded-md overflow-hidden">
                <img
                  src={StandInPlace}
                  alt="stand in place"
                  className="object-contain"
                />
              </div>
              <h3>Step 4.Get ready at your position</h3>
              <p>
                Get into your shooting area. Make sure the camera see your body
                well.
              </p>
            </div>
          )}
          {currentPage === 4 && (
            <div className="flex flex-col">
              <div className="flex-1 flex gap-2 w-full border rounded-md overflow-hidden">
                <div className="flex-1 max-h-[560px]">
                  <img
                    src={RaiseToStart}
                    alt="raise to start"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex-1">
                  <div className="p-2 border rounded-md mt-4">
                    <CountDownComponent className="w-full" />
                    <p>This wait for the countdown</p>
                  </div>
                  <div className="p-2 border rounded-md mt-4">
                    <div className="rounded-md p-2 border animate-blink h-[90px]">
                      <p>{`Round 1 is Recording!`}</p>
                      <p>Starting...</p>
                    </div>
                    <p>This Indicate the video is recording</p>
                  </div>
                </div>
              </div>
              <h3>Step 5. Start the recording</h3>
              <p>
                Raise your right hand above your head to start the recording.
                You will see 5 second count down then you can start shooting!
              </p>
            </div>
          )}
          {currentPage === 5 && (
            <div className="flex flex-col">
              <div className="flex-1 grid grid-cols-2 border rounded-md overflow-hidden">
                <div className="flex-1 max-h-[560px]">
                  <img
                    src={RaiseToStop}
                    alt="raise to stop"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex-1 border p-2 rounded-md">
                  <img
                    src={RecordingStop}
                    alt="recording stop"
                    className="object-contain"
                  />
                  <p>This indicate the video is processing</p>
                </div>
              </div>
              <h3>Step 6. Stop the recording</h3>
              <p>
                Raise your left hand above your head to stop the recording. Go
                grab your arrow back, the video will get uploaded and process in
                the background
              </p>
            </div>
          )}
          {currentPage === 6 && (
            <div className="flex flex-col">
              <div className="flex-1 grid grid-cols-3 w-full border rounded-md overflow-hidden">
                <img src={RaiseToStart} alt="" />
                <div>
                  <img src={RecordingStart} alt="" />
                  <img src={RecordingStop} alt="" className="mt-2" />
                </div>
                <img src={RaiseToStop} alt="" />
              </div>
              <h3>Step 7. Repeat!</h3>
              <p>
                Remember. Right hand to start, Left hand to stop. Do many round
                as you want.
              </p>
            </div>
          )}
          {currentPage === 7 && (
            <div className="flex flex-col">
              <div className="flex-1 grid grid-cols-2 border rounded-md overflow-hidden">
                <img src={EndButton} alt="" className="object-contain" />
                <img src={ResultExample} alt="" className="object-contain" />
              </div>
              <h3>Step 8. End the session</h3>
              <p>
                You are tired and want to call it a day? Press "End session" and
                it will take you to the detail page. Result might takes time to
                process so be patien {`<3`}
              </p>
            </div>
          )}
        </div>
        <div className="flex gap-3 justify-center">
          <Button
            variant="clean"
            size="no-space"
            onClick={onClickPreviousPage}
            disabled={currentPage === 0}
          >
            <ChevronLeft size={30} />
          </Button>
          <div className="flex items-center bg-white/20 py-2 px-4 rounded-3xl">
            {new Array(PAGES_COUNT).fill(null).map((_, index) => {
              return (
                <div
                  key={index}
                  className="cursor-pointer px-0.5 group"
                  onClick={() => setCurrentPage(index)}
                >
                  <div
                    className={cn([
                      "w-2 h-2 rounded-full transition-all",
                      "hover:w-3 hover:h-3 group-hover:w-3 group-hover:h-3",
                      currentPage === index
                        ? "bg-primary w-3 h-3"
                        : "bg-secondary",
                    ])}
                  />
                </div>
              );
            })}
          </div>
          <Button
            variant="clean"
            size="no-space"
            onClick={onClickNextPage}
            disabled={currentPage === PAGES_COUNT - 1}
          >
            <ChevronRight size={30} />
          </Button>
        </div>
        <DialogFooter>
          {currentPage === PAGES_COUNT - 1 ? (
            <Button onClick={() => onModalOpenChange(false, true)}>
              Close and do not show again
            </Button>
          ) : (
            <>
              <input
                id="do-not-show-again-cb"
                type="checkbox"
                checked={isNotShowChecked}
                onChange={() => setIsNotShowChecked(!isNotShowChecked)}
              />
              <label htmlFor="do-not-show-again-cb">Do not show again</label>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
