import React, { useEffect, useMemo, useState } from 'react';
import FireMap from './components/FireMap';
import { SearchParams, FireFeatureCollection } from './types';
import './App.css';
import { useFiresQuery } from './hooks/useFiresQuery';
import { eachDayOfInterval, format } from 'date-fns';
import { decodeState, encodeState, LayerSettings, Viewport } from './utils/urlState';

const App: React.FC = () => {
  const [baseParams, setBaseParams] = useState<SearchParams | null>(null);
  const [currentDate, setCurrentDate] = useState<string | null>(null);
  const [dates, setDates] = useState<string[]>([]);
  const [layerSettings, setLayerSettings] = useState<LayerSettings | undefined>(undefined);
  const [viewport, setViewport] = useState<Viewport>({});

  // Fetch once for the entire range; filter client-side by currentDate
  const queryParams = baseParams ? baseParams : undefined;
  const { data, isLoading, error } = useFiresQuery(queryParams);
  const emptyFireCollection: FireFeatureCollection = { type: 'FeatureCollection', features: [] };
  const fullCollection: FireFeatureCollection = data ?? emptyFireCollection;
  const fireCollection: FireFeatureCollection = useMemo(() => {
    if (!currentDate) return fullCollection;
    const filtered = fullCollection.features.filter(f => (f.properties as any)?.acq_date === currentDate);
    return { type: 'FeatureCollection', features: filtered };
  }, [fullCollection, currentDate]);

  // Utilities
  const computeDates = (start: string, end: string) => {
    const list = eachDayOfInterval({ start: new Date(start), end: new Date(end) }).map(d => format(d, 'yyyy-MM-dd'));
    setDates(list);
    if (!currentDate || list.indexOf(currentDate) === -1) setCurrentDate(list[0]);
  };

  // Hash -> state on load; fallback to localStorage when hash is absent
  useEffect(() => {
    const st = decodeState(window.location.hash);
    if (st) {
      if (st.mode === 'country' && st.country && st.start && st.end) {
        const params: SearchParams = { mode: 'country', country: st.country, startDate: st.start, endDate: st.end, format: 'geojson' };
        setBaseParams(params);
        computeDates(st.start, st.end);
        if (st.current) setCurrentDate(st.current);
      } else if (st.mode === 'bbox' && st.start && st.end && st.west !== undefined) {
        const params: SearchParams = { mode: 'bbox', west: st.west!, south: st.south!, east: st.east!, north: st.north!, startDate: st.start, endDate: st.end, format: 'geojson' };
        setBaseParams(params);
        computeDates(st.start, st.end);
        if (st.current) setCurrentDate(st.current);
      }
      if (st.layers) setLayerSettings(st.layers);
      if (st.vp) setViewport(st.vp);
    } else {
      try {
        const q = localStorage.getItem('firms:lastQuery');
        if (q) {
          const parsed = JSON.parse(q) as SearchParams;
          setBaseParams(parsed);
          computeDates(parsed.startDate, parsed.endDate);
          const cd = localStorage.getItem('firms:lastCurrentDate');
          if (cd) setCurrentDate(cd);
        }
        const ls = localStorage.getItem('firms:lastLayers');
        if (ls) setLayerSettings(JSON.parse(ls));
        const vp = localStorage.getItem('firms:lastViewport');
        if (vp) setViewport(JSON.parse(vp));
      } catch {}
    }
  }, []);

  // Persist to hash whenever key state changes
  useEffect(() => {
    if (!baseParams) return;
    const hash = encodeState({
      mode: baseParams.mode,
      country: baseParams.country,
      west: baseParams.west, south: baseParams.south, east: baseParams.east, north: baseParams.north,
      start: baseParams.startDate, end: baseParams.endDate, current: currentDate || undefined,
      layers: layerSettings, vp: viewport,
    });
    if (hash) window.location.hash = hash;
    // persist as fallback
    try {
      localStorage.setItem('firms:lastQuery', JSON.stringify(baseParams));
      if (currentDate) localStorage.setItem('firms:lastCurrentDate', currentDate);
    } catch {}
  }, [baseParams, currentDate, layerSettings, viewport]);

  const handleSearch = (params: SearchParams) => {
    setBaseParams(params);
    const allDates = eachDayOfInterval({ start: new Date(params.startDate), end: new Date(params.endDate) })
      .map(d => format(d, 'yyyy-MM-dd'));
    setDates(allDates);
    setCurrentDate(params.startDate);
  };

  const handleDateChange = (date: string) => {
    setCurrentDate(date);
  };

  return (
    <div className="relative">
      <FireMap
        fireCollection={fireCollection}
        fullCollection={fullCollection}
        onSearch={handleSearch}
        dates={dates}
        currentDate={currentDate || ''}
        onDateChange={handleDateChange}
        searchParams={baseParams}
        initialSettings={layerSettings}
        onSettingsChange={(s) => {
          setLayerSettings(s);
          try { localStorage.setItem('firms:lastLayers', JSON.stringify(s)); } catch {}
        }}
        onViewportChange={(vp) => {
          setViewport(vp);
          try { localStorage.setItem('firms:lastViewport', JSON.stringify(vp)); } catch {}
        }}
        onQuickRange={(token) => {
          // quick range recompute
          const today = new Date();
          const fmt = (d: Date) => format(d, 'yyyy-MM-dd');
          let start: string, end: string;
          if (token === 'today' || token === '24h') {
            start = fmt(today); end = fmt(today);
          } else if (token === '48h') {
            const s = new Date(today.getTime() - 24 * 3600 * 1000);
            start = fmt(s); end = fmt(today);
          } else if (token === '7d' || token === 'week') {
            const s = new Date(today.getTime() - 6 * 24 * 3600 * 1000);
            start = fmt(s); end = fmt(today);
          } else {
            start = baseParams?.startDate || fmt(today); end = baseParams?.endDate || fmt(today);
          }
          if (baseParams) {
            const next = { ...baseParams, startDate: start, endDate: end } as SearchParams;
            setBaseParams(next);
            const days = eachDayOfInterval({ start: new Date(start), end: new Date(end) }).map(d => fmt(d));
            setDates(days);
            setCurrentDate(days[days.length - 1]);
          }
        }}
      />
      {error && (
        <div className="absolute top-20 left-4 z-[1000] p-4 bg-red-100 text-red-700 rounded shadow-lg">
          {(error as Error).message}
        </div>
      )}
      {isLoading && (
        <div className="absolute top-20 left-4 z-[1000] p-4 bg-blue-100 text-blue-700 rounded shadow-lg">
          Loading...
        </div>
      )}
    </div>
  );
};

export default App;
