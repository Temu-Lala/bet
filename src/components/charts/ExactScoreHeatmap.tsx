"use client";

/**
 * Exact-score heatmap rendered as a CSS grid — no charting library.
 * matrix[i][j] = P(home = i, away = j).
 */
export function ExactScoreHeatmap({ matrix }: { matrix: number[][] }) {
  const size = matrix.length;
  const flat = matrix.flat();
  const maxP = Math.max(...flat, 0.0001);

  return (
    <div className="overflow-x-auto">
      <div
        className="grid min-w-[480px] gap-1"
        style={{ gridTemplateColumns: `repeat(${size + 1}, minmax(0, 1fr))` }}
      >
        <div className="flex items-end justify-center pb-1 text-[10px] text-foreground/40">
          H\A
        </div>
        {Array.from({ length: size }, (_, j) => (
          <div key={`col-${j}`} className="pb-1 text-center text-[10px] text-foreground/50">
            {j}
          </div>
        ))}

        {matrix.map((row, i) => (
          <FragmentRow key={`row-${i}`} i={i} row={row} maxP={maxP} />
        ))}
      </div>
    </div>
  );
}

function FragmentRow({
  i,
  row,
  maxP,
}: {
  i: number;
  row: number[];
  maxP: number;
}) {
  return (
    <>
      <div className="flex items-center justify-center text-[10px] text-foreground/50">{i}</div>
      {row.map((p, j) => {
        const intensity = Math.min(1, p / maxP);
        return (
          <div
            key={j}
            title={`${i}-${j}: ${(p * 100).toFixed(2)}%`}
            className="tabular flex aspect-square items-center justify-center rounded-md text-[10px] font-medium"
            style={{
              backgroundColor: `color-mix(in oklab, var(--accent) ${intensity * 85}%, var(--surface))`,
              color: intensity > 0.55 ? "white" : "var(--foreground)",
            }}
          >
            {intensity > 0.12 ? (p * 100).toFixed(1) : ""}
          </div>
        );
      })}
    </>
  );
}
