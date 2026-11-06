import type { GoalRangeProbability } from "../../../types/probability";
import {
  calculateGoalRanges,
  DEFAULT_GOAL_RANGES,
  type GoalRange,
} from "./goal-range-calculator";

/** Turn aggregated ranges into the presentation-ready contract type. */
export function aggregateRanges(
  probabilities: number[],
  tailProbability: number,
  ranges: GoalRange[] = DEFAULT_GOAL_RANGES,
): GoalRangeProbability[] {
  return calculateGoalRanges(probabilities, tailProbability, ranges).map(
    ({ range, probability }) => ({
      label: range.label,
      min: range.min,
      max: range.max,
      probability,
    }),
  );
}
