import React, { useMemo, useState } from 'react';
import { useMapStore } from '../../stores';

const clampDays = (value: number): number => Math.min(Math.max(value, 1), 10);

const subtractDays = (date: string, offset: number): string => {
  const base = new Date(date);
  base.setDate(base.getDate() - offset);
  return base.toISOString().slice(0, 10);
};

const computeSpan = (start: string, end: string): number => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diff = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  return clampDays(diff || 1);
};

export const TimeSlider: React.FC = () => {
  const lastQuery = useMapStore((state) => state.lastSubmittedQuery);
  const submitQuery = useMapStore((state) => state.submitQuery);

  const endDate = lastQuery?.endDate ?? new Date().toISOString().slice(0, 10);
  const initialSpan = useMemo(() => {
    if (lastQuery?.startDate) {
      return computeSpan(lastQuery.startDate, endDate);
    }
    return 3;
  }, [lastQuery?.startDate, endDate]);

  const [span, setSpan] = useState<number>(initialSpan);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const raw = Number(event.target.value);
    const days = clampDays(raw);
    setSpan(days);

    if (!lastQuery) {
      return;
    }

    const nextStart = subtractDays(endDate, days - 1);
    submitQuery({
      ...lastQuery,
      startDate: nextStart,
      endDate,
    });
  };

  return (
    <section className="time-card">
      <header>
        <h2>Time window</h2>
        <p>Adjust the date range (max 10 days) relative to the latest end date.</p>
      </header>
      <div className="time-slider">
        <label htmlFor="timeSpan">Range</label>
        <input
          id="timeSpan"
          type="range"
          min={1}
          max={10}
          value={span}
          onChange={handleChange}
        />
        <div className="time-slider__summary">
          <span>{span} day(s)</span>
          <span>
            {lastQuery?.startDate ?? subtractDays(endDate, span - 1)} to {endDate}
          </span>
        </div>
      </div>
    </section>
  );
};


