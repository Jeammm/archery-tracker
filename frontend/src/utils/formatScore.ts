import { Round } from "@/types/session";

export const calculateAccumulatedScore = (rounds: Round[]) => {
  return rounds.map((_, index) =>
    rounds
      .slice(0, index + 1)
      .reduce((acc, curr) => acc + (curr?.total_score || 0), 0)
  );
};
