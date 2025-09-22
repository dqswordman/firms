import React, { useEffect, useMemo, useState } from 'react';
import FireMap from './components/FireMap';
import { SearchParams, FireFeatureCollection } from './types';
import './App.css';
import { useFiresQuery } from './hooks/useFiresQuery';
import { eachDayOfInterval, format } from 'date-fns';
import { LayerSettings, Viewport } from './utils/urlState';

const App: React.FC = () => {
  const [baseParams, setBaseParams] = useState<SearchParams | null>(null);
  const [currentDate, setCurrentDate] = useState<string | null>(null);
  const [dates, setDates] = useState<string[]>([]);
  const [layerSettings, setLayerSettings] = useState<LayerSettings | undefined>(undefined);
  const [viewport, setViewport] = useState<Viewport>({});
  const [autoFitVersion, setAutoFitVersion] = useState(0);

  // Fetch once for the entire range; filter client-side by currentDate
  const queryParams = baseParams ? baseParams : undefined;
  const { data, isLoading, error } = useFiresQuery(queryParams);
  const emptyFireCollection: FireFeatureCollection = { type: 'FeatureCollection', features: [] };
  const fullCollection: FireFeatureCollection = data ?? emptyFireCollection;
  const fireCollection: FireFeatureCollection = useMemo(() => {
    if (!currentDate) return fullCollection;
    const filtered = (fullCollection?.features ?? []).filter(
      f => (f.properties as any)?.acq_date === currentDate
    );
    return { type: 'FeatureCollection', features: filtered };
  }, [fullCollection, currentDate]);

  // Utilities
  const computeDates = (start: string, end: string) => {
    const list = eachDayOfInterval({ start: new Date(start), end: new Date(end) }).map(d => format(d, 'yyyy-MM-dd'));
    setDates(list);
    if (!currentDate || list.indexOf(currentDate) === -1) setCurrentDate(list[0]);
  };

  // Do not restore previous session (URL hash/localStorage disabled per request)
  useEffect(() => {
    // Intentionally left blank: start with a clean session each load
  }, []);

  // Disable persistence (URL hash/localStorage)
  useEffect(() => {
    // no-op: do not write state on change
  }, [baseParams, currentDate, layerSettings, viewport]);

  const handleSearch = (params: SearchParams) => {
    setBaseParams(params);
    const allDates = eachDayOfInterval({ start: new Date(params.startDate), end: new Date(params.endDate) })
      .map(d => format(d, 'yyyy-MM-dd'));
    setDates(allDates);
    setCurrentDate(params.startDate);
    setAutoFitVersion(v => v + 1);
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
        }}
        onViewportChange={(vp) => {
          setViewport(vp);
        }}
        autoFitVersion={autoFitVersion}
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
            setAutoFitVersion(v => v + 1);
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
