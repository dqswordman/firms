import React, { useEffect, useMemo, useState } from 'react';
import { useMapStore } from '../../stores';
import { FiresQueryParams } from '../../types';

type Mode = FiresQueryParams['mode'];

type DraftState = {
  country: string;
  west: string;
  south: string;
  east: string;
  north: string;
  startDate: string;
  endDate: string;
};

type ValidationResult = {
  valid: boolean;
  errors: string[];
  params?: FiresQueryParams;
};

const toIsoDate = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toISOString().slice(0, 10);
};

const diffDays = (start: string, end: string): number => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diff = endDate.getTime() - startDate.getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
};

const clampRange = (date: Date, days: number): string => {
  const clone = new Date(date);
  clone.setDate(clone.getDate() + days);
  return clone.toISOString().slice(0, 10);
};

const parseNumber = (value: string): number | null => {
  if (!value.trim()) {
    return null;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return parsed;
};

const validate = (mode: Mode, draft: DraftState): ValidationResult => {
  const errors: string[] = [];

  const { startDate, endDate } = draft;
  if (!startDate || !endDate) {
    errors.push('Please choose start and end dates');
  } else {
    const start = toIsoDate(startDate);
    const end = toIsoDate(endDate);
    if (new Date(start) > new Date(end)) {
      errors.push('End date cannot be earlier than start date');
    }
    if (diffDays(start, end) > 10) {
      errors.push('Date range cannot exceed 10 days');
    }
  }

  const base: FiresQueryParams = {
    mode,
    startDate: toIsoDate(startDate),
    endDate: toIsoDate(endDate),
    format: 'geojson',
  };

  if (mode === 'country') {
    const country = draft.country.trim().toUpperCase();
    if (!country) {
      errors.push('Enter ISO3 country code');
    } else if (country.length !== 3) {
      errors.push('Country code must be 3-letter ISO3');
    } else {
      base.country = country;
    }
  } else {
    const west = parseNumber(draft.west);
    const south = parseNumber(draft.south);
    const east = parseNumber(draft.east);
    const north = parseNumber(draft.north);
    if ([west, south, east, north].some((value) => value == null)) {
      errors.push('Enter all bounding box coordinates');
    } else if ((west as number) >= (east as number) || (south as number) >= (north as number)) {
      errors.push('Ensure west < east and south < north');
    } else {
      base.west = west as number;
      base.south = south as number;
      base.east = east as number;
      base.north = north as number;
    }
  }

  return { valid: errors.length === 0, errors, params: errors.length === 0 ? base : undefined };
};

const emptyDraft: DraftState = {
  country: '',
  west: '',
  south: '',
  east: '',
  north: '',
  startDate: '',
  endDate: '',
};

const populateDraftFromQuery = (query: FiresQueryParams | null): DraftState => {
  if (!query) {
    return emptyDraft;
  }
  return {
    country: query.country ?? '',
    west: query.west != null ? String(query.west) : '',
    south: query.south != null ? String(query.south) : '',
    east: query.east != null ? String(query.east) : '',
    north: query.north != null ? String(query.north) : '',
    startDate: query.startDate ?? '',
    endDate: query.endDate ?? '',
  };
};

export const QueryPanel: React.FC = () => {
  const lastQuery = useMapStore((state) => state.lastSubmittedQuery);
  const submitQuery = useMapStore((state) => state.submitQuery);

  const initialMode = lastQuery?.mode ?? 'country';
  const [mode, setMode] = useState<Mode>(initialMode);
  const [draft, setDraft] = useState<DraftState>(() =>
    populateDraftFromQuery(lastQuery ?? null)
  );
  const [errors, setErrors] = useState<string[]>([]);

  const today = useMemo(() => new Date(), []);
  const defaultEnd = today.toISOString().slice(0, 10);
  const defaultStart = clampRange(today, -2);

  const effectiveDraft = useMemo(() => ({
    ...draft,
    startDate: draft.startDate || defaultStart,
    endDate: draft.endDate || defaultEnd,
  }), [draft, defaultStart, defaultEnd]);

  const handleModeChange = (nextMode: Mode) => {
    setMode(nextMode);
    if (nextMode === 'country') {
      setDraft((prev) => ({
        ...prev,
        west: '',
        south: '',
        east: '',
        north: '',
      }));
    } else {
      setDraft((prev) => ({
        ...prev,
        country: '',
      }));
    }
  };

  useEffect(() => {
    if (!lastQuery) {
      return;
    }
    setMode(lastQuery.mode);
    setDraft(populateDraftFromQuery(lastQuery));
  }, [lastQuery]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = validate(mode, effectiveDraft);
    if (!result.valid || !result.params) {
      setErrors(result.errors);
      return;
    }
    setErrors([]);
    submitQuery(result.params);
  };

  const bind = (field: keyof DraftState) => ({
    value: effectiveDraft[field],
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;
      setDraft((prev) => ({ ...prev, [field]: value }));
    },
  });

  return (
    <section className="query-card">
      <header>
        <h2>Query</h2>
        <p>Choose a country or bbox to request fresh FIRMS data.</p>
      </header>
      <form className="query-form" onSubmit={handleSubmit} data-testid="query-form">
        <div className="query-field">
          <label htmlFor="mode">Mode</label>
          <select
            id="mode"
            value={mode}
            onChange={(event) => handleModeChange(event.target.value as Mode)}
          >
            <option value="country">Country ISO3</option>
            <option value="bbox">Custom bbox</option>
          </select>
        </div>

        {mode === 'country' ? (
          <div className="query-field">
            <label htmlFor="country">ISO3 (e.g. USA)</label>
            <input id="country" type="text" maxLength={3} {...bind('country')} />
          </div>
        ) : (
          <div className="query-grid">
            <div className="query-field">
              <label htmlFor="west">West</label>
              <input id="west" type="number" step="0.01" {...bind('west')} />
            </div>
            <div className="query-field">
              <label htmlFor="south">South</label>
              <input id="south" type="number" step="0.01" {...bind('south')} />
            </div>
            <div className="query-field">
              <label htmlFor="east">East</label>
              <input id="east" type="number" step="0.01" {...bind('east')} />
            </div>
            <div className="query-field">
              <label htmlFor="north">North</label>
              <input id="north" type="number" step="0.01" {...bind('north')} />
            </div>
          </div>
        )}

        <div className="query-grid">
          <div className="query-field">
            <label htmlFor="startDate">Start date</label>
            <input id="startDate" type="date" {...bind('startDate')} />
          </div>
          <div className="query-field">
            <label htmlFor="endDate">End date</label>
            <input id="endDate" type="date" {...bind('endDate')} />
          </div>
        </div>

        {errors.length ? (
          <ul className="query-errors" role="alert">
            {errors.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        ) : null}

        <button type="submit" className="query-submit">
          Run query
        </button>
      </form>
    </section>
  );
};
