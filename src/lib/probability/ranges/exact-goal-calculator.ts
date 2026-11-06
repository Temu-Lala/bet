import type { GoalProbability } from "../../../types/probability";

/** Convert a distribution vector into exact-goal records. */
export function toExactGoalProbabilities(probabilities: number[]): GoalProbability[] {
  return probabilities.map((probability, goals) => ({ goals, probability }));
}

/** P(a <= X <= b) directly from a distribution vector, tail optional. */
export function rangeFromVector(
  probabilities: number[],
  min: number,
  max: number | null,
  tailProbability = 0,
): number {
  let total = 0;
  for (let goals = min; goals < probabilities.length; goals++) {
    if (max !== null && goals > max) break;
    total += probabilities[goals];
  }
  if (max === null) total += tailProbability;
  return total;
}
