import { poissonPmf } from "../core/poisson-pmf";

/**
 * Both Teams To Score from the two independent scoring rates.
 * P(BTTS) = (1 - P(home = 0)) * (1 - P(away = 0))
 */
export function bttsProbabilities(
  lambdaHome: number,
  lambdaAway: number,
): { yes: number; no: number } {
  const homeBlank = poissonPmf(0, lambdaHome);
  const awayBlank = poissonPmf(0, lambdaAway);
  const yes = (1 - homeBlank) * (1 - awayBlank);
  return { yes, no: 1 - yes };
}
