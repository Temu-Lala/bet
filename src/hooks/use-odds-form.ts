"use client";

import { useMemo } from "react";
import { useStoreSelector } from "@/lib/utils/store";
import { oddsStore, setOddsValue, setTeamName, setBookmaker } from "@/stores/odds-store";
import { validateRows, rowsToMarkets } from "@/lib/validation/odds.schema";
import { sampleMarketOdds, defaultMarketScaffold } from "@/lib/probability";
import type { OddsFormRow } from "@/lib/validation/odds.schema";

/**
 * Odds form hook: React-native controlled inputs on top of the odds store,
 * with live validation computed from the same engine validators the
 * calculation uses (single source of truth — no duplicated rules).
 */
export function useOddsForm() {
  const state = useStoreSelector(oddsStore, (s) => s);

  const rows = useMemo<OddsFormRow[]>(
    () => [...state.rows, ...state.customLines],
    [state],
  );
  const validation = useMemo(() => validateRows(rows), [rows]);
  const markets = useMemo(() => rowsToMarkets(rows), [rows]);

  const sample = useMemo(
    () =>
      rowsToMarkets(sampleMarketOdds().map((m) => ({
        line: m.line,
        marketType: m.marketType,
        under: m.under === null ? "" : String(m.under),
        over: m.over === null ? "" : String(m.over),
      }))),
    [],
  );

  return {
    teamName: state.teamName,
    bookmaker: state.bookmaker,
    rows,
    markets,
    validation,
    sample,
    scaffold: defaultMarketScaffold(),
    setTeamName,
    setBookmaker,
    setOddsValue,
  };
}
