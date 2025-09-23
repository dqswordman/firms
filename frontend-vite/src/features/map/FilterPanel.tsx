import React, { useEffect, useState } from 'react';
import { useMapStore } from '../../stores';

const clampNumber = (value: string): number | null => {
  if (!value.trim()) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const FilterPanel: React.FC = () => {
  const filters = useMapStore((state) => state.filters);
  const setFilters = useMapStore((state) => state.setFilters);
  const [localMin, setLocalMin] = useState<string>(filters.frpMin?.toString() ?? '');
  const [localMax, setLocalMax] = useState<string>(filters.frpMax?.toString() ?? '');
  const [error, setError] = useState<string | null>(null);

  const confidence = filters.confidence;

  useEffect(() => {
    setLocalMin(filters.frpMin?.toString() ?? '');
    setLocalMax(filters.frpMax?.toString() ?? '');
  }, [filters.frpMin, filters.frpMax]);

  const applyRange = (minValue: string, maxValue: string) => {
    const min = clampNumber(minValue);
    const max = clampNumber(maxValue);
    if (min != null && max != null && min > max) {
      setError('FRP minimum cannot exceed maximum');
      return;
    }
    setError(null);
    setFilters({ frpMin: min, frpMax: max });
  };

  return (
    <section className="filter-card">
      <header>
        <h2>Filters</h2>
        <p>Adjust FRP and confidence to refine the visible detections.</p>
      </header>
      <div className="filter-grid">
        <div className="filter-field">
          <label htmlFor="frpMin">FRP min</label>
          <input
            id="frpMin"
            type="number"
            step="1"
            value={localMin}
            onChange={(event) => setLocalMin(event.target.value)}
            onBlur={() => applyRange(localMin, localMax)}
          />
        </div>
        <div className="filter-field">
          <label htmlFor="frpMax">FRP max</label>
          <input
            id="frpMax"
            type="number"
            step="1"
            value={localMax}
            onChange={(event) => setLocalMax(event.target.value)}
            onBlur={() => applyRange(localMin, localMax)}
          />
        </div>
      </div>
      <div className="filter-field">
        <label htmlFor="confidence">Confidence</label>
        <select
          id="confidence"
          value={confidence}
          onChange={(event) => setFilters({ confidence: event.target.value as typeof confidence })}
        >
          <option value="all">All</option>
          <option value="low">Low</option>
          <option value="nominal">Nominal</option>
          <option value="high">High</option>
        </select>
      </div>
      {error ? (
        <p className="filter-error" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
};
