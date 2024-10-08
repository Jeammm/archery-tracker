export const calculateAccumulatedScore = (scores: number[]) => {
  return scores.map((_, index) =>
    scores.slice(0, index + 1).reduce((acc, curr) => acc + curr, 0)
  );
};
