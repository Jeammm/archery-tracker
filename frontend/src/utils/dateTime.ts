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

export function formatSecondsToMMSS(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${String(minutes).padStart(2, "0")}:${String(
    remainingSeconds
  ).padStart(2, "0")}`;
}

export function timeAgo(date: string) {
  const now = new Date();
  const past = new Date(date);
  const seconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (seconds < 60) {
    return `${seconds} seconds ago`;
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} minutes ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hours ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days} days ago`;
  }

  const weeks = Math.floor(days / 7);
  if (weeks < 4) {
    return `${weeks} weeks ago`;
  }

  const months = Math.floor(days / 30);
  if (months < 12) {
    return `${months} months ago`;
  }

  const years = Math.floor(days / 365);
  return `${years} years ago`;
}
