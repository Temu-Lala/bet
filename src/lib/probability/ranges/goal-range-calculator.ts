/**
 * Generic goal-range aggregation. Ranges are data, not hardcoded logic:
 * any { min, max | null } band over the exact-goal distribution works.
 */

export interface GoalRange {
  label: string;
  min: number;
  /** null means open-ended ("6+"), which also absorbs the tail mass. */
  max: number | null;
}

export const DEFAULT_GOAL_RANGES: GoalRange[] = [
  { label: "0-1", min: 0, max: 1 },
  { label: "2-3", min: 2, max: 3 },
  { label: "4-5", min: 4, max: 5 },
  { label: "6+", min: 6, max: null },
];

/**
 * Aggregate probabilities within a range. For an open-ended range the
 * remaining tail beyond `probabilities.length - 1` is included so no
 * probability mass is lost.
 */
export function calculateGoalRange(
  probabilities: number[],
  range: GoalRange,
  tailProbability = 0,
): number {
  let total = 0;

  for (let goals = range.min; goals < probabilities.length; goals++) {
    if (range.max !== null && goals > range.max) break;
    total += probabilities[goals];
  }

  if (range.max === null) {
    total += tailProbability;
  }

  return total;
}

/** Aggregate a whole list of ranges against one distribution. */
export function calculateGoalRanges(
  probabilities: number[],
  tailProbability: number,
  ranges: GoalRange[] = DEFAULT_GOAL_RANGES,
): { range: GoalRange; probability: number }[] {
  return ranges.map((range) => ({
    range,
    probability: calculateGoalRange(probabilities, range, tailProbability),
  }));
}
