import { format } from "date-fns";

export function formatDateTime(date: Date | string) {
  return format(date, "d-M-yyyy / HH:mm");
}

export function getTimeDeltaInMinutes(
  date1: Date | string,
  date2: Date | string
): number {
  // Convert inputs to Date objects if they are not already
  const d1 = typeof date1 === "string" ? new Date(date1) : date1;
  const d2 = typeof date2 === "string" ? new Date(date2) : date2;

  // Check if both dates are valid
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
    throw new Error("Invalid date input");
  }

  // Calculate the difference in milliseconds
  const deltaMilliseconds = Math.abs(d1.getTime() - d2.getTime());

  // Convert milliseconds to minutes
  const deltaMinutes = deltaMilliseconds / (1000 * 60);

  return deltaMinutes;
}

export function formatSecondsToMMSS(seconds:number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}