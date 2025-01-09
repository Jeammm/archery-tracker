import { Round } from "@/types/session";

export const calculateAccumulatedScore = (rounds: Round[]) => {
  return rounds.map((_, index) =>
    rounds
      .slice(0, index + 1)
      .reduce((acc, curr) => acc + (curr?.total_score || 0), 0)
  );
};

export const formatTTS = (tts: number) => {
  if (tts > 0) {
    return `${(tts * 1000).toFixed(0)} ms`;
  }

  return "-";
};
