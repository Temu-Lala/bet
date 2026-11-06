/** Application-wide constants shared by engine defaults and the UI. */

export const APP_NAME = "Football Probability Analyzer";

export const DEFAULT_MAX_GOALS = 15;
export const MIN_MAX_GOALS = 6;
export const MAX_MAX_GOALS = 30;

export const DEFAULT_MARGIN_METHOD = "MULTIPLICATIVE" as const;
export const DEFAULT_MODEL = "POISSON" as const;
export const DEFAULT_PRECISION = 2;

export const STORAGE_KEYS = {
  history: "fpa.history.v1",
  settings: "fpa.settings.v1",
  draftOdds: "fpa.draft.v1",
  lastResult: "fpa.lastResult.v1",
} as const;

export const HISTORY_LIMIT = 100;
