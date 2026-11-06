"use client";

import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/common/PageHeader";
import { useStoreSelector } from "@/lib/utils/store";
import { settingsStore, updateSettings } from "@/stores/settings-store";
import { MODEL_OPTIONS, MARGIN_METHODS } from "@/config/models";
import { DEFAULT_MARKET_WEIGHTS } from "@/lib/probability/markets/market-boundaries";
import { DEFAULT_STAKING_OPTIONS } from "@/types/market";
import type { StakingOptions } from "@/types/market";
import { DEFAULT_SETTINGS } from "@/lib/storage/settings-storage";
import type { AppSettings } from "@/lib/storage/settings-storage";
import type { MarketWeights } from "@/types/odds";

export default function SettingsPage() {
  const settings = useStoreSelector(settingsStore, (s) => s);

  const optionRow =
    "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors";

  return (
    <PageContainer>
      <PageHeader
        title="Settings"
        subtitle="Defaults applied to new calculations. Stored analyses are never re-interpreted by a setting change."
      />

      <div className="max-w-3xl space-y-8">
        <section>
          <h3 className="mb-3 text-sm font-semibold">Appearance</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
            {(["light", "dark"] as const).map((theme) => (
              <button
                key={theme}
                type="button"
                onClick={() => updateSettings({ theme })}
                className={`${optionRow} ${
                  settings.theme === theme
                    ? "border-accent bg-accent-soft/40"
                    : "border-border bg-surface hover:bg-surface-muted"
                }`}
              >
                <span className="text-sm font-medium capitalize">{theme} mode</span>
              </button>
            ))}
          </div>
        </section>

        <section>
          <h3 className="mb-1 text-sm font-semibold">Model</h3>
          <p className="mb-3 text-xs text-foreground/50">
            The fitting model converts market boundaries into a full goal distribution.
          </p>
          <div className="space-y-3">
            {MODEL_OPTIONS.map((model) => {
              const selected = settings.model === model.value;
              return (
                <button
                  key={model.value}
                  type="button"
                  disabled={!model.available}
                  onClick={() =>
                    model.available &&
                    updateSettings({ model: model.value as AppSettings["model"] })
                  }
                  className={`${optionRow} w-full text-left ${
                    selected
                      ? "border-accent bg-accent-soft/40"
                      : "border-border bg-surface hover:bg-surface-muted"
                  } ${!model.available ? "cursor-not-allowed opacity-50 hover:bg-surface" : ""}`}
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {model.label}
                      {!model.available && (
                        <span className="ml-2 rounded bg-surface-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-foreground/50">
                          planned
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-xs text-foreground/55">{model.description}</p>
                  </div>
                  {selected && <span className="text-xs font-semibold text-accent">active</span>}
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <h3 className="mb-1 text-sm font-semibold">Margin removal</h3>
          <p className="mb-3 text-xs text-foreground/50">
            How the bookmaker overround is distributed when deriving market probabilities.
          </p>
          <div className="overflow-hidden rounded-xl border border-border bg-surface">
            {MARGIN_METHODS.map((method) => (
              <label
                key={method.value}
                className={`flex cursor-pointer items-center gap-3 border-b border-border/50 px-4 py-3 last:border-0 ${
                  settings.marginMethod === method.value ? "bg-accent-soft/30" : ""
                }`}
              >
                <input
                  type="radio"
                  name="marginMethod"
                  checked={settings.marginMethod === method.value}
                  onChange={() =>
                    updateSettings({ marginMethod: method.value as AppSettings["marginMethod"] })
                  }
                  className="accent-[var(--accent)]"
                />
                <div>
                  <p className="text-sm font-medium">{method.label}</p>
                  <p className="text-xs text-foreground/50">{method.description}</p>
                </div>
              </label>
            ))}
          </div>
        </section>

        <section>
          <h3 className="mb-1 text-sm font-semibold">Market reliability weights</h3>
          <p className="mb-3 text-xs text-foreground/50">
            Relative influence of each market category in the weighted least-squares fit. Markets
            differ in liquidity and how much bookmaker margin contaminates them. Zero excludes a
            category from the fit entirely — it stays visible in the breakdown, clearly labeled.
          </p>
          <div className="space-y-3">
            {([
              {
                key: "completeStandard",
                label: "Complete standard O/U pair",
                hint: "Both sides quoted on a .5 line; margin fully removable — the most reliable input.",
              },
              {
                key: "completeAsianWhole",
                label: "Complete Asian whole line",
                hint: "Both sides on a .0 line; the push at exactly the line is accounted for in the fit.",
              },
              {
                key: "oneSided",
                label: "One-sided market",
                hint: "Only one side quoted; the price still contains the bookmaker margin, so it is down-weighted by default.",
              },
            ] as const).map((w) => (
              <div
                key={w.key}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3"
              >
                <div className="max-w-md">
                  <p className="text-sm font-medium">{w.label}</p>
                  <p className="text-xs text-foreground/50">{w.hint}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-foreground/40">
                    default {DEFAULT_MARKET_WEIGHTS[w.key].toFixed(2)}
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={2}
                    step={0.05}
                    aria-label={`${w.label} weight`}
                    value={settings.marketWeights[w.key]}
                    onChange={(e) => {
                      const n = Number.parseFloat(e.target.value);
                      const value = Number.isFinite(n)
                        ? Math.min(2, Math.max(0, n))
                        : DEFAULT_MARKET_WEIGHTS[w.key];
                      updateSettings({
                        marketWeights: { ...settings.marketWeights, [w.key]: value },
                      });
                    }}
                    className="tabular w-20 rounded-lg border border-border bg-background px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-accent/40"
                  />
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() =>
              updateSettings({ marketWeights: { ...DEFAULT_MARKET_WEIGHTS } as MarketWeights })
            }
            className="mt-3 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-surface-muted"
          >
            Restore engine default weights
          </button>
        </section>

        <section>
          <h3 className="mb-1 text-sm font-semibold">Bankroll &amp; staking</h3>
          <p className="mb-3 text-xs text-foreground/50">
            Applied on the Value &amp; Risk screen to the last analysis. Kelly stakes are suppressed
            when the model-market fit error is above threshold regardless of these values.
          </p>
          <div className="space-y-3">
            {([
              {
                key: "bankroll",
                label: "Bankroll",
                hint: "Total funds the stake recommendations are sized against. Your own number - the app never guesses it.",
                min: 1,
                max: 1_000_000,
                step: 50,
                default: DEFAULT_STAKING_OPTIONS.bankroll,
                suffix: "",
              },
              {
                key: "kellyMultiplier",
                label: "Kelly fraction",
                hint: "Scale applied to the full-Kelly growth optimum. 0.25 (quarter Kelly) is the recommended conservative default for estimated probabilities.",
                min: 0.05,
                max: 1,
                step: 0.05,
                default: DEFAULT_STAKING_OPTIONS.kellyMultiplier,
                suffix: "× full Kelly",
              },
              {
                key: "maxStakeFraction",
                label: "Maximum stake per bet",
                hint: "Hard cap as a fraction of bankroll, applied after Kelly scaling - the safety net when Kelly is overconfident.",
                min: 0.005,
                max: 0.1,
                step: 0.005,
                default: DEFAULT_STAKING_OPTIONS.maxStakeFraction,
                suffix: "of bankroll",
              },
            ] as const).map((f) => (
              <div
                key={f.key}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3"
              >
                <div className="max-w-md">
                  <p className="text-sm font-medium">{f.label}</p>
                  <p className="text-xs text-foreground/50">{f.hint}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-foreground/40">
                    default {f.default}
                  </span>
                  <input
                    type="number"
                    min={f.min}
                    max={f.max}
                    step={f.step}
                    aria-label={f.label}
                    value={settings.staking[f.key]}
                    onChange={(e) => {
                      const n = Number.parseFloat(e.target.value);
                      const value = Number.isFinite(n)
                        ? Math.min(f.max, Math.max(f.min, n))
                        : f.default;
                      updateSettings({
                        staking: { ...settings.staking, [f.key]: value } as StakingOptions,
                      });
                    }}
                    className="tabular w-24 rounded-lg border border-border bg-background px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-accent/40"
                  />
                  {f.suffix && <span className="text-[11px] text-foreground/40">{f.suffix}</span>}
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => updateSettings({ staking: { ...DEFAULT_STAKING_OPTIONS } })}
            className="mt-3 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-surface-muted"
          >
            Restore default staking frame
          </button>
        </section>

        <section className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-sm font-medium" htmlFor="maxGoals">
              Maximum goals modeled
            </label>
            <input
              id="maxGoals"
              type="number"
              min={6}
              max={30}
              step={1}
              value={settings.maxGoals}
              onChange={(e) => {
                const n = Number.parseInt(e.target.value, 10);
                if (Number.isFinite(n)) updateSettings({ maxGoals: Math.min(30, Math.max(6, n)) });
              }}
              className="tabular w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/40"
            />
            <p className="text-xs leading-relaxed text-foreground/50">
              Distribution depth (6–30). Probability beyond this bound is retained as a tail and
              absorbed by the open-ended range — never discarded.
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium" htmlFor="precision">
              Display precision
            </label>
            <select
              id="precision"
              value={settings.precision}
              onChange={(e) => updateSettings({ precision: Number.parseInt(e.target.value, 10) })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/40"
            >
              {[0, 1, 2, 3, 4].map((p) => (
                <option key={p} value={p}>
                  {p} decimal{p === 1 ? "" : "s"}
                </option>
              ))}
            </select>
            <p className="text-xs leading-relaxed text-foreground/50">
              Presentation only. The engine always computes on full-precision decimals.
            </p>
          </div>
        </section>

        <section className="border-t border-border pt-6">
          <button
            type="button"
            onClick={() => updateSettings({ ...DEFAULT_SETTINGS, theme: settings.theme })}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-surface-muted"
          >
            Reset calculation defaults
          </button>
          <p className="mt-2 text-xs text-foreground/50">
            Restores model, margin method, goal depth and precision. Appearance is kept.
          </p>
        </section>
      </div>
    </PageContainer>
  );
}
