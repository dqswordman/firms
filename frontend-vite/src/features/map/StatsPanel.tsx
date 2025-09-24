import React from 'react';
import { ChartsPanel } from './ChartsPanel';
import { useMapStore } from '../../stores';
import { useFireStatsQuery, useFiresQuery } from '../../queries/fires';
import { applyFilters } from './filterUtils';

type StatEntry = [string, string];

const formatValue = (value: unknown): string => {
  if (value == null) {
    return '--';
  }
  if (typeof value === 'number') {
    return value.toLocaleString();
  }
  if (typeof value === 'string') {
    return value;
  }
  return JSON.stringify(value, null, 2);
};

const toEntries = (data: Record<string, unknown> | undefined): StatEntry[] => {
  if (!data) {
    return [];
  }
  return Object.entries(data).map(([key, value]) => [key, formatValue(value)]);
};

export const StatsPanel: React.FC = () => {
  const lastQuery = useMapStore((state) => state.lastSubmittedQuery);
  const filters = useMapStore((state) => state.filters);
  // Map toggle is handled in Root dashboard; keep Stats focused on analytics

  // Always call the hook to keep hooks order stable; gate execution with `enabled`.
  const { data, isFetching, isError, error } = useFireStatsQuery(lastQuery ?? undefined, {
    enabled: Boolean(lastQuery),
    retry: false,
  });

  // Client-side analytics that reflect Filters without refetch
  const { data: firesData } = useFiresQuery(lastQuery ?? undefined, {
    enabled: Boolean(lastQuery),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
  const filtered = applyFilters(firesData, filters);
  const clientStats: Record<string, unknown> | undefined = (() => {
    const feats = filtered?.features ?? [];
    if (!feats.length) return undefined;
    let total = 0, sumFrp = 0, maxFrp = 0, day = 0, night = 0, hi = 0, mid = 0, lo = 0, viirs = 0, terra = 0, aqua = 0;
    for (const f of feats) {
      total += 1;
      const p: any = f.properties || {};
      const frpVal = Number(p.frp ?? p.FRP ?? 0) || 0;
      sumFrp += frpVal; if (frpVal > maxFrp) maxFrp = frpVal;
      if (String(p.daynight || '').toUpperCase() === 'D') day += 1; else night += 1;
      const conf = String(p.confidence ?? '').toLowerCase();
      if (conf === 'h' || (/^\d+$/.test(conf) && Number(conf) >= 80)) hi += 1; else if (conf === 'n' || (/^\d+$/.test(conf) && Number(conf) >= 30)) mid += 1; else lo += 1;
      const sat = String(p.satellite || '').toUpperCase();
      if (sat.startsWith('N')) viirs += 1; else if (sat === 'T') terra += 1; else aqua += 1;
    }
    const avgFrp = total ? sumFrp / total : 0;
    return { totalPoints: total, avgFrp, maxFrp, sumFrp, dayCount: day, nightCount: night, highConfidence: hi, mediumConfidence: mid, lowConfidence: lo, viirsCount: viirs, terraCount: terra, aquaCount: aqua };
  })();

  return (
    <section className="stats-card">
      <header>
        <h2>Analytics</h2>
        <p>
          {lastQuery
            ? <>Results reflect current filters (FRP min/max: {filters.frpMin ?? '--'} / {filters.frpMax ?? '--'}, confidence: {filters.confidence}).</>
            : 'Run a query to load FRP, confidence, and satellite summaries.'}
        </p>
        
      </header>
      {isFetching ? (
        <p className="stats-status" role="status">Loading analytics...</p>
      ) : null}
      {isError ? (
        <p className="stats-status" role="alert">{error?.message ?? 'Failed to load analytics.'}</p>
      ) : null}
      {!isFetching && !isError ? (
        <dl className="stats-grid">
          {toEntries((clientStats as Record<string, unknown>) ?? (data as Record<string, unknown> | undefined)).map(([label, value]) => (
            <div key={label} className="stats-item">
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
          {((clientStats && toEntries(clientStats).length === 0) || (!clientStats && data && toEntries(data).length === 0)) ? (
            <p className="stats-status">No analytics available for this range.</p>
          ) : null}
        </dl>
      ) : null}
    </section>
  );
};

