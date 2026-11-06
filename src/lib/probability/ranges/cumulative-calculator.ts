/** Cumulative goal probabilities P(X <= k) from a distribution vector. */
export function cumulativeFromVector(
  probabilities: number[],
): Record<string, number> {
  const cumulative: Record<string, number> = {};
  let running = 0;
  for (let goals = 0; goals < probabilities.length; goals++) {
    running += probabilities[goals];
    cumulative[`P(X<=${goals})`] = running;
  }
  return cumulative;
}

/** Under P / Over P for a goal line derived straight from the vector. */
export function underOverFromVector(
  probabilities: number[],
  line: number,
): { under: number; push: number; over: number } {
  const k = Math.floor(line);
  const wholeLine = Number.isInteger(line);
  // Whole asian line: under wins at X <= k-1, push at X = k.
  const underLimit = wholeLine ? k - 1 : k;
  let under = 0;
  for (let goals = 0; goals <= Math.min(underLimit, probabilities.length - 1); goals++) {
    under += probabilities[goals];
  }
  const push = wholeLine && k < probabilities.length ? probabilities[k] : 0;
  // Remaining mass (including the retained tail) belongs to over.
  const over = Math.max(0, 1 - under - push);
  return { under, push, over };
}
