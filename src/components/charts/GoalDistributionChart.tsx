"use client";

import type { GoalProbability } from "@/types/probability";

/**
 * Goal distribution bar chart, rendered with plain SVG.
 * A charting library is not needed for a single categorical series, and
 * staying dependency-free keeps the bundle lean.
 */
export function GoalDistributionChart({
  exactGoals,
  highlightRange,
}: {
  exactGoals: GoalProbability[];
  /** Optional range shading, e.g. { min: 2, max: 3 } for the 2-3 band. */
  highlightRange?: { min: number; max: number | null };
}) {
  const values = exactGoals.map((g) => g.probability);
  const maxP = Math.max(...values, 0.001);

  const width = 640;
  const height = 220;
  const padLeft = 8;
  const padBottom = 24;
  const chartHeight = height - padBottom;
  const barCount = exactGoals.length;
  const gap = 6;
  const barWidth = (width - padLeft * 2 - gap * (barCount - 1)) / barCount;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full"
      role="img"
      aria-label="Exact goal probability distribution"
    >
      {exactGoals.map(({ goals, probability }, i) => {
        const x = padLeft + i * (barWidth + gap);
        const h = (probability / maxP) * (chartHeight - 16);
        const y = chartHeight - h;

        const inRange =
          highlightRange &&
          goals >= highlightRange.min &&
          (highlightRange.max === null || goals <= highlightRange.max);

        return (
          <g key={goals}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={h}
              rx={3}
              className={inRange ? "fill-accent" : "fill-accent/35"}
            />
            <text
              x={x + barWidth / 2}
              y={chartHeight + 14}
              textAnchor="middle"
              className="fill-current text-foreground/60"
              fontSize="11"
            >
              {goals}
            </text>
            {probability === maxP && (
              <text
                x={x + barWidth / 2}
                y={y - 5}
                textAnchor="middle"
                className="fill-current text-foreground/70"
                fontSize="10"
              >
                {(probability * 100).toFixed(1)}%
              </text>
            )}
          </g>
        );
      })}
      <line
        x1={padLeft}
        y1={chartHeight}
        x2={width - padLeft}
        y2={chartHeight}
        className="stroke-border"
        strokeWidth="1"
      />
    </svg>
  );
}
