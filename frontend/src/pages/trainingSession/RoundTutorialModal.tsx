import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import RedRightArrow from "@/assets/tutorial/red_right_arrow.png";
import RedDownArrow from "@/assets/tutorial/red_down_arrow.png";

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
      forceNotShowAgain && setIsNotShowChecked(forceNotShowAgain);
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
      <DialogContent className="max-w-[min(1000px,85%)] flex flex-col">
        <DialogHeader>
          <DialogTitle>How to start</DialogTitle>
          <DialogDescription>
            Simple guide to help you through easy steps to get started!
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2 flex-1">
          {currentPage === 0 && (
            <div className="flex flex-col">
              <div className="flex gap-2 w-full border rounded-md overflow-hidden h-[530px]">
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
              <TutorialPageDsecription
                pageNo={currentPage}
                title="Allow camera usage request"
                description="Archery tracker use your devices camera in order to record and
                store your training video"
              />
            </div>
          )}
          {currentPage === 1 && (
            <div className="flex flex-col">
              <div className="flex gap-2 w-full border rounded-md overflow-hidden h-[530px]">
                <img
                  src={ScanWithMobile}
                  alt="scan with mobile"
                  className="w-full object-contain"
                />
              </div>
              <TutorialPageDsecription
                pageNo={currentPage}
                title="Connect you 2nd camera by scanning QR code"
                description="Scan QR code with your mobile phone to use as a 2nd camera."
              />
            </div>
          )}
          {currentPage === 2 && (
            <div className="flex flex-col">
              <div className="flex gap-2 w-full border rounded-md overflow-hidden h-[530px]">
                <img
                  src={PlaceMobileInPlace}
                  alt="place mobile in place"
                  className="max-h-[560px] object-contain"
                />
              </div>
              <TutorialPageDsecription
                pageNo={currentPage}
                title="Put your mobile phone in place"
                description="Your mobile phone will be used as target camera feed. make sure
                your phone is held tight and see target clearly"
              />
            </div>
          )}
          {currentPage === 3 && (
            <div className="flex flex-col">
              <div className="flex gap-2 w-full border rounded-md overflow-hidden h-[530px]">
                <img
                  src={StandInPlace}
                  alt="stand in place"
                  className="object-contain"
                />
              </div>
              <TutorialPageDsecription
                pageNo={currentPage}
                title="Get ready at your position"
                description="Get into your shooting area. Make sure the camera see your body
                well."
              />
            </div>
          )}
          {currentPage === 4 && (
            <div className="flex flex-col">
              <div className="flex gap-2 w-full border rounded-md overflow-hidden h-[530px]">
                <div className="flex-1">
                  <img
                    src={RaiseToStart}
                    alt="raise to start"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="w-32 h-60">
                  <img
                    src={RedRightArrow}
                    alt="red arrow"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex-1">
                  <div className="p-2 border rounded-md mt-4">
                    <CountDownComponent className="w-full" />
                    <p>Wait for the countdown</p>
                  </div>
                  <div className="h-24 w-full my-4">
                    <img
                      src={RedDownArrow}
                      alt="red arrow"
                      className="h-full mx-auto w-fit object-contain"
                    />
                  </div>
                  <div className="p-2 border rounded-md">
                    <div className="rounded-md p-2 border animate-blink h-[90px]">
                      <p>{`Round 1 is Recording!`}</p>
                      <p>Starting...</p>
                    </div>
                    <p>This Indicate the video is recording</p>
                  </div>
                </div>
              </div>
              <TutorialPageDsecription
                pageNo={currentPage}
                title="Start the recording"
                description="Raise your right hand above your head to start the recording.
                You will see 5 second count down then you can start shooting!"
              />
            </div>
          )}
          {currentPage === 5 && (
            <div className="flex flex-col">
              <div className="grid grid-cols-[1fr,auto,1fr] border rounded-md overflow-hidden h-[530px]">
                <div className="flex-1 max-h-[560px]">
                  <img
                    src={RaiseToStop}
                    alt="raise to stop"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="w-32">
                  <img
                    src={RedRightArrow}
                    alt="red arrow"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex items-center">
                  <div className="flex-1 border p-2 rounded-md h-fit">
                    <img
                      src={RecordingStop}
                      alt="recording stop"
                      className="object-contain"
                    />
                    <p>This indicate the video is processing</p>
                  </div>
                </div>
              </div>
              <TutorialPageDsecription
                pageNo={currentPage}
                title="Stop the recording"
                description="Raise your left hand above your head to stop the recording. It is time to go
                grab your arrow back."
              />
            </div>
          )}
          {currentPage === 6 && (
            <div className="flex flex-col flex-1">
              <div className="w-full border rounded-md overflow-hidden h-[530px]">
                <div className="flex h-1/2">
                  <img
                    src={RaiseToStart}
                    alt="raise to start"
                    className="w-64"
                  />
                  <img
                    src={RedRightArrow}
                    alt="red arrow"
                    className="object-fill flex-1 h-16 my-20 px-4"
                  />
                  <img src={RecordingStart} alt="recording start" />
                </div>
                <div className="flex h-1/2">
                  <img src={RaiseToStop} alt="raise to stop" className="w-64" />
                  <img
                    src={RedRightArrow}
                    alt="red arrow"
                    className="object-fill flex-1 h-16 my-20 px-4"
                  />
                  <img
                    src={RecordingStop}
                    alt="recording stop"
                    className="mt-2"
                  />
                </div>
              </div>
              <TutorialPageDsecription
                pageNo={currentPage}
                title="Repeat!"
                description="Remember. Right hand to start, Left hand to stop. Do many round
                as you want."
              />
            </div>
          )}
          {currentPage === 7 && (
            <div className="flex flex-col">
              <div className="grid grid-cols-2 border rounded-md overflow-hidden h-[530px]">
                <img src={EndButton} alt="" className="object-contain" />
                <img src={ResultExample} alt="" className="object-contain" />
              </div>
              <TutorialPageDsecription
                pageNo={currentPage}
                title="End the session"
                description='Done for today? Press "End session" and
                it will take you to the detail page. Result might takes time to
                process.'
              />
            </div>
          )}
        </div>
        <div className="flex gap-3 justify-center relative">
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
          <div className="absolute right-0">
            {currentPage === PAGES_COUNT - 1 ? (
              <Button onClick={() => onModalOpenChange(false, true)}>
                Close and do not show again
              </Button>
            ) : (
              <div className="h-[36px] flex items-center gap-2">
                <input
                  id="do-not-show-again-cb"
                  type="checkbox"
                  checked={isNotShowChecked}
                  onChange={() => setIsNotShowChecked(!isNotShowChecked)}
                />
                <label htmlFor="do-not-show-again-cb">Do not show again</label>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface TutorialPageDsecriptionProps {
  pageNo: number;
  title: string;
  description: string;
}

const TutorialPageDsecription = (props: TutorialPageDsecriptionProps) => {
  const { pageNo, title, description } = props;
  return (
    <div className="mt-3">
      <h3 className="text-2xl font-semibold">
        Step {pageNo + 1}. {title}
      </h3>
      <p className="my-2">{description}</p>
    </div>
  );
};
