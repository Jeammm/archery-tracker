import { useState, useEffect } from "react";

export const useTimeElapsed = ({
  startDatetime,
}: {
  startDatetime: string | undefined;
}) => {
  const startTime = startDatetime
    ? new Date(startDatetime).getTime()
    : new Date().getTime();

  const [elapsedTime, setElapsedTime] = useState(
    new Date().getTime() - startTime
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const currentTime = new Date().getTime();
      const timeDifference = currentTime - startTime;
      setElapsedTime(timeDifference);
    }, 1000);

    return () => clearInterval(interval); // Cleanup on unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDatetime]);

  // Function to format the time in HH:MM:SS
  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  return {
    elapsedTime: formatTime(elapsedTime),
    timeReady: startDatetime && elapsedTime !== 0,
  };
};
