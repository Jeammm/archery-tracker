import { Round } from "@/types/session";

export const calculateScoreByRound = (rounds: Round[]) => {
  return rounds.map((round, index) => {
    return (
      round.score
        ?.slice(0, index + 1)
        .reduce((acc, curr) => acc + curr.score, 0) || 0
    );
  });
};

export const calculateAccumulatedScore = (rounds: Round[]) => {
  const scoreByRound = calculateScoreByRound(rounds);

  return scoreByRound.map((_, index) =>
    scoreByRound.slice(0, index + 1).reduce((acc, curr) => acc + curr, 0)
  );
};
