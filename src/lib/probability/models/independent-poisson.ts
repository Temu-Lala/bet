import { poissonPmf } from "../core/poisson-pmf";

/**
 * Independent Poisson two-team model.
 *
 * Home and away goal counts are modeled as independent Poisson variables:
 *
 *   P(home = i, away = j) = Poisson(i; lambdaHome) * Poisson(j; lambdaAway)
 *
 * Independence is an assumption, not a fact; Dixon-Coles (phase 3) adjusts
 * the low-score corner where the assumption is weakest.
 */
export function independentScoreMatrix(
  lambdaHome: number,
  lambdaAway: number,
  maxGoals: number,
): { matrix: number[][]; homeMarginal: number[]; awayMarginal: number[] } {
  const homeMarginal: number[] = [];
  const awayMarginal: number[] = [];
  for (let k = 0; k <= maxGoals; k++) {
    homeMarginal.push(poissonPmf(k, lambdaHome));
    awayMarginal.push(poissonPmf(k, lambdaAway));
  }

  const matrix: number[][] = [];
  for (let i = 0; i <= maxGoals; i++) {
    const row: number[] = [];
    for (let j = 0; j <= maxGoals; j++) {
      row.push(homeMarginal[i] * awayMarginal[j]);
    }
    matrix.push(row);
  }

  return { matrix, homeMarginal, awayMarginal };
}

/** Derived match-outcome probabilities from a score matrix. */
export function outcomesFromMatrix(matrix: number[][]): {
  homeWin: number;
  draw: number;
  awayWin: number;
} {
  let homeWin = 0;
  let draw = 0;
  let awayWin = 0;
  for (let i = 0; i < matrix.length; i++) {
    for (let j = 0; j < matrix[i].length; j++) {
      const p = matrix[i][j];
      if (i > j) homeWin += p;
      else if (i === j) draw += p;
      else awayWin += p;
    }
  }
  return { homeWin, draw, awayWin };
}

/** P(both teams score at least one goal). */
export function bttsFromMatrix(matrix: number[][]): { yes: number; no: number } {
  let yes = 0;
  for (let i = 1; i < matrix.length; i++) {
    for (let j = 1; j < matrix[i].length; j++) yes += matrix[i][j];
  }
  return { yes, no: 1 - yes };
}
