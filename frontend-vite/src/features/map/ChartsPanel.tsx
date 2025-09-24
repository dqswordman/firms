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
    const end = filters.dateEnd || lastQuery?.endDate;
    if (!end) return { labels: [], values: [] };
    const feats = (filtered?.features ?? []).filter((f) => getDate(f.properties) === end);
    let viirs = 0, terra = 0, aqua = 0;
    for (const f of feats) {
      const sat = String(f.properties?.satellite || '').toUpperCase();
      if (sat.startsWith('N')) viirs += 1; else if (sat === 'T') terra += 1; else aqua += 1;
    }
    return { labels: ['VIIRS', 'Terra', 'Aqua'], values: [viirs, terra, aqua] };
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
            data={{ labels: radar.labels, datasets: [{ label: 'Today', data: radar.values, backgroundColor: 'rgba(139, 92, 246, 0.35)', borderColor: '#8b5cf6', pointBackgroundColor: '#8b5cf6' }] }}
            options={{ responsive: true, plugins: { legend: { labels: { color: '#e2e8f0' } } }, scales: { r: { angleLines: { color: 'rgba(226,232,240,0.2)' }, grid: { color: 'rgba(226,232,240,0.2)' }, pointLabels: { color: '#e2e8f0' }, ticks: { display: false } } } }}
            redraw
          />
        </div>
      ) : null}
    </section>
  );
};


