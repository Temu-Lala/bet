import type { StoredCalculation } from "@/types/odds";
import { STORAGE_KEYS, HISTORY_LIMIT } from "@/lib/utils/constants";
import { isProbabilityResult } from "@/lib/validation/probability.schema";

/**
 * Browser-storage persistence for the analysis history (phase 7 of the
 * roadmap). All reads are defensive: corrupt or schema-failing entries are
 * dropped rather than rendered.
 */

function isStoredCalculation(value: unknown): value is StoredCalculation {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.createdAt === "string" &&
    typeof candidate.input === "object" &&
    typeof candidate.options === "object" &&
    isProbabilityResult(candidate.result)
  );
}

/** In-tab change signal (the "storage" event only fires in other tabs). */
export const HISTORY_CHANGED_EVENT = "fpa:history-changed";

function announceHistoryChange(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(HISTORY_CHANGED_EVENT));
}

export function loadHistory(): StoredCalculation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.history);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isStoredCalculation);
  } catch {
    return [];
  }
}

export function saveToHistory(entry: StoredCalculation): StoredCalculation[] {
  const history = loadHistory().filter((item) => item.id !== entry.id);
  history.unshift(entry);
  const trimmed = history.slice(0, HISTORY_LIMIT);
  try {
    window.localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(trimmed));
  } catch {
    // Storage full or unavailable: history is a convenience, never critical.
  }
  announceHistoryChange();
  return trimmed;
}

export function removeFromHistory(id: string): StoredCalculation[] {
  const history = loadHistory().filter((item) => item.id !== id);
  try {
    window.localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(history));
  } catch {
    // ignore
  }
  announceHistoryChange();
  return history;
}

export function clearHistory(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEYS.history);
  } catch {
    // ignore
  }
  announceHistoryChange();
}
