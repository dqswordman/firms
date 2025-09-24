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

const pad2 = (n: number) => (n < 10 ? `0${n}` : `${n}`);
const toLocalISO = (date: Date): string => `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
const localOffsetHours = (): number => -new Date().getTimezoneOffset() / 60;
const nowInTz = (offsetHours: number): Date => {
  const utcMs = Date.now() + new Date().getTimezoneOffset() * 60000;
  return new Date(utcMs + offsetHours * 3600000);
};
const toIsoDate = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return toLocalISO(date);
};

const diffDays = (start: string, end: string): number => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diff = endDate.getTime() - startDate.getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
};

const addDaysLocal = (date: Date, days: number): string => {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() + days);
  return toLocalISO(d);
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
    const today = new Date();
    const todayLocal = new Date(today.getTime() - today.getTimezoneOffset() * 60000);
    const todayIso = todayLocal.toISOString().slice(0, 10);
    if (new Date(end) > new Date(todayIso)) {
      errors.push('End date cannot exceed today');
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

  // Approximate timezone by country ISO3 or bbox center longitude
  const tzByCountry: Record<string, number> = {
    USA: -5, CHN: 8, THA: 7, IND: 5.5, JPN: 9, KOR: 9, AUS: 10, RUS: 3,
    BRA: -3, MEX: -6, CAN: -5, GBR: 0, FRA: 1, DEU: 1, ESP: 1, ITA: 1,
  };

  const inferredTzOffset = useMemo(() => {
    if (mode === 'country') {
      const iso3 = (draft.country || '').trim().toUpperCase();
      return tzByCountry[iso3] ?? localOffsetHours();
    }
    const west = parseNumber(draft.west);
    const east = parseNumber(draft.east);
    if (west != null && east != null) {
      const centerLng = (west + east) / 2;
      const approx = Math.max(-12, Math.min(14, Math.round(centerLng / 15)));
      return approx;
    }
    return localOffsetHours();
  }, [mode, draft.country, draft.west, draft.east]);

  const todayRef = useMemo(() => nowInTz(inferredTzOffset), [inferredTzOffset]);
  const defaultEnd = toLocalISO(todayRef);
  const defaultStart = addDaysLocal(todayRef, -2);

  const [preset, setPreset] = useState<'24h' | '48h' | '7d' | 'custom'>('7d');

  const presetStart = useMemo(() => {
    switch (preset) {
      case '24h':
        return addDaysLocal(todayRef, -1);
      case '48h':
        return addDaysLocal(todayRef, -2);
      case '7d':
        return addDaysLocal(todayRef, -6);
      default:
        return draft.startDate || defaultStart;
    }
  }, [preset, todayRef, defaultStart, draft.startDate]);

  const effectiveDraft = useMemo(() => {
    if (preset === 'custom') {
      return {
        ...draft,
        startDate: draft.startDate || defaultStart,
        endDate: draft.endDate || defaultEnd,
      };
    }
    return {
      ...draft,
      startDate: presetStart,
      endDate: defaultEnd,
    };
  }, [draft, defaultStart, defaultEnd, preset, presetStart]);

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

  const handlePresetChange = (value: '24h' | '48h' | '7d' | 'custom') => {
    setPreset(value);
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
          <label>Range</label>
          <div className="query-presets">
            <label><input type="radio" name="preset" checked={preset==='24h'} onChange={() => handlePresetChange('24h')} /> Last 24h</label>
            <label><input type="radio" name="preset" checked={preset==='48h'} onChange={() => handlePresetChange('48h')} /> Last 48h</label>
            <label><input type="radio" name="preset" checked={preset==='7d'} onChange={() => handlePresetChange('7d')} /> Last 7 days</label>
            <label><input type="radio" name="preset" checked={preset==='custom'} onChange={() => handlePresetChange('custom')} /> Custom</label>
          </div>
        </div>
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
            <input id="startDate" type="date" max={defaultEnd} disabled={preset!=='custom'} {...bind('startDate')} />
          </div>
          <div className="query-field">
            <label htmlFor="endDate">End date</label>
            <input id="endDate" type="date" max={defaultEnd} disabled={preset!=='custom'} {...bind('endDate')} />
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
