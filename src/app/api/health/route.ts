import { NextResponse } from "next/server";
import { poissonPmf } from "@/lib/probability/core/poisson-pmf";

/**
 * Health check: reports runtime status and verifies the calculation engine
 * with a known reference value (Poisson lambda=1, P(0) = e^-1).
 */
export function GET() {
  const reference = poissonPmf(0, 1);
  const engineOk = Math.abs(reference - Math.exp(-1)) < 1e-12;

  return NextResponse.json({
    status: engineOk ? "ok" : "engine_check_failed",
    engine: {
      model: "poisson",
      referenceP0: reference,
      expected: Math.exp(-1),
    },
    timestamp: new Date().toISOString(),
  });
}
