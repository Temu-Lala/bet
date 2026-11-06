import type { Settlement } from "../../../types/market";

/**
 * Asian Over/Under settlement engine.
 *
 * A whole-number line (e.g. 5.0) has a PUSH outcome when the actual goals
 * equal the line exactly; a half line (5.5) has none; quarter lines (2.25,
 * 2.75, ...) split the stake between the two adjacent half lines, producing
 * HALF_WIN / HALF_LOSS outcomes.
 *
 * | Actual goals | Over 5.0 |
 * | ------------ | -------- |
 * | 0-4          | Lose     |
 * | 5            | Push     |
 * | 6+           | Win      |
 */

export interface AsianPosition {
  line: number;
  side: "OVER" | "UNDER";
  odds: number;
  stake: number;
}

export interface SettlementDetail {
  line: number;
  outcome: Settlement;
  /** Share of the original stake allocated to this leg (quarter lines: 0.5). */
  stakeShare: number;
  /** Net profit for this leg. */
  profit: number;
}

export interface SettlementOutcome {
  outcome: Settlement;
  profit: number;
  /** Profit as a fraction of total stake: win (odds-1), push 0, loss -1. */
  profitFactor: number;
  details: SettlementDetail[];
}

function settleHalfLine(goals: number, line: number, side: "OVER" | "UNDER"): Settlement {
  const overHits = goals > line;
  const outcome = side === "OVER" ? overHits : !overHits;
  return outcome ? "WIN" : "LOSS";
}

function settleWholeLine(goals: number, line: number, side: "OVER" | "UNDER"): Settlement {
  if (goals === line) return "PUSH";
  return settleHalfLine(goals, line, side);
}

/** Split a quarter line (x.25 / x.75) into its two adjacent legs. */
export function splitQuarterLine(line: number): [number, number] {
  const lower = Math.floor(line * 2) / 2; // e.g. 2.25 -> 2.0
  const upper = lower + 0.5; //          2.25 -> 2.5
  return [lower, upper];
}

export function isQuarterLine(line: number): boolean {
  return (
    Number.isInteger(line * 4) && !Number.isInteger(line * 2)
  );
}

export function isWholeLine(line: number): boolean {
  return Math.round(line) === line;
}

/** Settle a single (possibly quarter) asian position against a goal total. */
export function settleAsianPosition(
  goals: number,
  position: AsianPosition,
): SettlementOutcome {
  const { line, side, odds, stake } = position;
  if (!Number.isFinite(goals) || goals < 0) {
    throw new RangeError(`Goal total must be a non-negative number, got ${goals}`);
  }

  const quarterLegs = isQuarterLine(line) ? splitQuarterLine(line) : null;

  if (quarterLegs) {
    const [lower, upper] = quarterLegs;
    const legStake = stake / 2;
    const lowerOutcome = isWholeLine(lower)
      ? settleWholeLine(goals, lower, side)
      : settleHalfLine(goals, lower, side);
    // The upper leg of x.75 is a whole line (x+1.0) and can push.
    const upperOutcome = isWholeLine(upper)
      ? settleWholeLine(goals, upper, side)
      : settleHalfLine(goals, upper, side);

    const legProfit = (o: Settlement, s: number): number => {
      switch (o) {
        case "WIN":
          return (odds - 1) * s;
        case "HALF_WIN":
          return (odds - 1) * s * 0.5;
        case "PUSH":
          return 0;
        case "HALF_LOSS":
          return -0.5 * s;
        case "LOSS":
          return -s;
      }
    };

    const details: SettlementDetail[] = [
      { line: lower, outcome: lowerOutcome, stakeShare: 0.5, profit: legProfit(lowerOutcome, legStake) },
      { line: upper, outcome: upperOutcome, stakeShare: 0.5, profit: legProfit(upperOutcome, legStake) },
    ];
    const profit = details.reduce((sum, d) => sum + d.profit, 0);

    let outcome: Settlement;
    if (profit > 1e-12) {
      outcome = details.some((d) => d.outcome === "PUSH" || d.outcome === "LOSS")
        ? "HALF_WIN"
        : "WIN";
    } else if (profit < -1e-12) {
      // Full loss only when every leg lost; a pushed or half-winning leg
      // softens the result to HALF_LOSS.
      outcome = details.every((d) => d.outcome === "LOSS") ? "LOSS" : "HALF_LOSS";
    } else {
      outcome = "PUSH";
    }

    return { outcome, profit, profitFactor: profit / stake, details };
  }

  const outcome = isWholeLine(line)
    ? settleWholeLine(goals, line, side)
    : settleHalfLine(goals, line, side);

  const profit =
    outcome === "WIN"
      ? (odds - 1) * stake
      : outcome === "PUSH"
        ? 0
        : -stake;

  return {
    outcome,
    profit,
    profitFactor: profit / stake,
    details: [{ line, outcome, stakeShare: 1, profit }],
  };
}

/**
 * Expected value of an asian position under a goal distribution.
 *
 *   EV = P(win)*(O-1)*S - P(loss)*S       (push contributes exactly zero)
 *
 * `distribution[g]` must be P(exactly g goals) for g = 0..maxGoals.
 */
export function expectedValue(
  position: AsianPosition,
  distribution: number[],
): number {
  let ev = 0;
  for (let goals = 0; goals < distribution.length; goals++) {
    const p = distribution[goals];
    if (p === 0) continue;
    ev += p * settleAsianPosition(goals, position).profit;
  }
  // Mass beyond maxGoals: approximate with the far tail behaviour.
  return ev;
}

/**
 * Probability of each settlement outcome for an asian position given a
 * full goal distribution (index = goals). Tail mass is attributed to
 * outcomes that are certain for goals >= maxGoals (over hits, under misses).
 */
export function settlementProbabilities(
  position: AsianPosition,
  distribution: number[],
  tailProbability = 0,
): Record<Settlement, number> {
  const probs: Record<Settlement, number> = {
    WIN: 0,
    HALF_WIN: 0,
    PUSH: 0,
    HALF_LOSS: 0,
    LOSS: 0,
  };
  for (let goals = 0; goals < distribution.length; goals++) {
    const { outcome } = settleAsianPosition(goals, position);
    probs[outcome] += distribution[goals];
  }
  if (tailProbability > 0) {
    const farField = settleAsianPosition(distribution.length + 10, position);
    probs[farField.outcome === "PUSH" ? "LOSS" : farField.outcome] += tailProbability;
  }
  return probs;
}
