/**
 * Generic bounded 1-D optimizers shared by the fitting layer.
 */

export interface MinimizeResult {
  x: number;
  fx: number;
  iterations: number;
  converged: boolean;
}

/** Golden-section search for a unimodal minimum of f on [a, b]. */
export function goldenSectionMinimize(
  f: (x: number) => number,
  bounds: [number, number],
  tolerance = 1e-9,
  maxIterations = 120,
): MinimizeResult {
  const [a0, b0] = bounds;
  if (!(b0 > a0)) throw new RangeError("Bounds must satisfy min < max");
  const gr = (Math.sqrt(5) - 1) / 2;
  let a = a0;
  let b = b0;
  let c = b - gr * (b - a);
  let d = a + gr * (b - a);
  let fc = f(c);
  let fd = f(d);
  let iterations = 0;

  while (b - a > tolerance && iterations < maxIterations) {
    if (fc < fd) {
      b = d;
      d = c;
      fd = fc;
      c = b - gr * (b - a);
      fc = f(c);
    } else {
      a = c;
      c = d;
      fc = fd;
      d = a + gr * (b - a);
      fd = f(d);
    }
    iterations++;
  }

  const x = (a + b) / 2;
  return { x, fx: f(x), iterations, converged: iterations < maxIterations };
}
