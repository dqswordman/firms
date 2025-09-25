import React, { useMemo, useState } from 'react';
import { useMapStore } from '../../stores';
import { useFiresQuery } from '../../queries/fires';
import { applyFilters } from './filterUtils';

import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend, CategoryScale, LinearScale } from 'chart.js';
import { Radar, Line } from 'react-chartjs-2';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend, CategoryScale, LinearScale);

const getDate = (props: any): string => (props?.acq_date as string) || (props?.acq_datetime ? String(props.acq_datetime).slice(0, 10) : '');

export const ChartsPanel: React.FC = () => {
  const lastQuery = useMapStore((s) => s.lastSubmittedQuery);
  const filters = useMapStore((s) => s.filters);
  const enable = Boolean(lastQuery);
  const { data } = useFiresQuery(lastQuery ?? undefined, { enabled: enable, retry: false, staleTime: 5 * 60 * 1000 });

  const [showDaily, setShowDaily] = useState(true);
  const [showRadar, setShowRadar] = useState(true);

  const filtered = useMemo(() => applyFilters(data, filters), [data, filters]);

  const daily = useMemo(() => {
    const map = new Map<string, number>();
    const feats = filtered?.features ?? [];
    for (const f of feats) {
      const d = getDate(f.properties);
      if (!d) continue;
      map.set(d, (map.get(d) ?? 0) + 1);
    }
    const labels = Array.from(map.keys()).sort();
    const values = labels.map((k) => map.get(k) ?? 0);
    return { labels, values };
  }, [filtered]);

  const radar = useMemo(() => {
    const featsAll = filtered?.features ?? [];
    if (!featsAll.length) return { labels: [] as string[], values: [] as number[], title: '' };

    // Prefer the latest available date within range; fallback to all data if that day has no points
    const end = filters.dateEnd || lastQuery?.endDate || '';
    const dates = Array.from(new Set(featsAll.map((f) => getDate(f.properties)).filter(Boolean))).sort();
    const pickedDate = (dates.filter((d) => (end ? d <= end : true)).pop() || dates[dates.length - 1]) as string;
    const byDay = featsAll.filter((f) => getDate(f.properties) === pickedDate);
    const use = byDay.length ? byDay : featsAll;

    // Derive FRP buckets + Day/Night distribution (percentages)
    const frp = (p: any) => {
      const v = typeof p?.frp === 'number' ? p.frp : Number(p?.frp ?? NaN);
      return Number.isFinite(v) ? v : 0;
    };
    const total = use.length;
    const frpHigh = use.filter((f) => frp(f.properties) >= 20).length;
    const frpMid = use.filter((f) => {
      const v = frp(f.properties);
      return v >= 5 && v < 20;
    }).length;
    const frpLow = use.filter((f) => frp(f.properties) < 5).length;
    const day = use.filter((f) => String(f.properties?.daynight || '').toUpperCase() === 'D').length;
    const night = use.filter((f) => String(f.properties?.daynight || '').toUpperCase() === 'N').length;

    const pct = (n: number) => (total ? (n * 100) / total : 0);
    return {
      labels: ['High FRP', 'Medium FRP', 'Low FRP', 'Day', 'Night'],
      values: [pct(frpHigh), pct(frpMid), pct(frpLow), pct(day), pct(night)],
      title: byDay.length ? `Distribution (${pickedDate})` : 'Distribution (range)'
    };
  }, [filtered, filters.dateEnd, lastQuery?.endDate]);

  return (
    <section className="stats-card">
      <header>
        <h2>Charts</h2>
        <p>Derived from the current query and filters. Radar uses the current end date.</p>
      </header>
      {!enable ? <p className="stats-status">Run a query to generate charts.</p> : null}

      <div className="layer-toggle-group" style={{ marginBottom: '0.5rem' }}>
        <label className="layer-toggle"><input type="checkbox" checked={showDaily} onChange={() => setShowDaily(!showDaily)} /> Daily counts</label>
        <label className="layer-toggle"><input type="checkbox" checked={showRadar} onChange={() => setShowRadar(!showRadar)} /> Radar (today)</label>
      </div>

      {enable && showDaily && daily.labels.length ? (
        <Line
          data={{
            labels: daily.labels,
            datasets: [
              {
                label: 'Detections',
                data: daily.values,
                borderColor: '#f59e0b',
                backgroundColor: 'rgba(245, 158, 11, 0.25)',
                fill: true,
                tension: 0.25,
                pointRadius: 2,
                borderWidth: 2,
              },
            ],
          }}
          options={{
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
              x: { ticks: { color: '#e2e8f0' }, grid: { color: 'rgba(226,232,240,0.2)' } },
              y: { ticks: { color: '#e2e8f0' }, grid: { color: 'rgba(226,232,240,0.2)' } },
            },
          }}
          redraw
        />
      ) : null}

      {enable && showRadar && radar.labels.length ? (
        <div style={{ marginTop: '0.75rem' }}>
          <Radar
            data={{ labels: radar.labels, datasets: [{ label: radar.title || 'Distribution', data: radar.values, backgroundColor: 'rgba(139, 92, 246, 0.35)', borderColor: '#8b5cf6', pointBackgroundColor: '#8b5cf6' }] }}
            options={{ responsive: true, plugins: { legend: { labels: { color: '#e2e8f0' } }, tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${Number(ctx.raw as number).toFixed(1)}%` } } }, scales: { r: { angleLines: { color: 'rgba(226,232,240,0.2)' }, grid: { color: 'rgba(226,232,240,0.2)' }, pointLabels: { color: '#e2e8f0' }, ticks: { display: true, callback: (v) => `${v}%`, stepSize: 20 } } } }}
            redraw
          />
        </div>
      ) : null}
    </section>
  );
};


