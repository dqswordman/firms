import React from 'react';
import { useMapStore } from '../../stores';
import { useFireStatsQuery } from '../../queries/fires';

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

  // Avoid creating a TanStack Query when no query is present
  // so the panel can render without a QueryClientProvider.
  if (!lastQuery) {
    return (
      <section className="stats-card">
        <header>
          <h2>Analytics</h2>
          <p>Run a query to load FRP, confidence, and satellite summaries.</p>
        </header>
      </section>
    );
  }

  const { data, isFetching, isError, error } = useFireStatsQuery(lastQuery, {
    enabled: true,
    retry: false,
  });

  return (
    <section className="stats-card">
      <header>
        <h2>Analytics</h2>
        <p>Results reflect current filters (FRP min/max: {filters.frpMin ?? '--'} / {filters.frpMax ?? '--'}, confidence: {filters.confidence}).</p>
      </header>
      {isFetching ? (
        <p className="stats-status" role="status">Loading analytics...</p>
      ) : null}
      {isError ? (
        <p className="stats-status" role="alert">{error?.message ?? 'Failed to load analytics.'}</p>
      ) : null}
      {!isFetching && !isError ? (
        <dl className="stats-grid">
          {toEntries(data).map(([label, value]) => (
            <div key={label} className="stats-item">
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
          {data && toEntries(data).length === 0 ? (
            <p className="stats-status">No analytics available for this range.</p>
          ) : null}
        </dl>
      ) : null}
    </section>
  );
};
