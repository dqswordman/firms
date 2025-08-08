import React, { useState } from 'react';
import FireMap from './components/FireMap';
import { SearchParams, FireFeatureCollection } from './types';
import './App.css';
import { useFiresQuery } from './hooks/useFiresQuery';
import { eachDayOfInterval, format } from 'date-fns';

const App: React.FC = () => {
  const [baseParams, setBaseParams] = useState<SearchParams | null>(null);
  const [currentDate, setCurrentDate] = useState<string | null>(null);
  const [dates, setDates] = useState<string[]>([]);

  const queryParams = baseParams && currentDate
    ? { ...baseParams, startDate: currentDate, endDate: currentDate }
    : undefined;
  const { data, isLoading, error } = useFiresQuery(queryParams);
  const fireCollection: FireFeatureCollection = data || { type: 'FeatureCollection', features: [] };

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
        onSearch={handleSearch}
        dates={dates}
        currentDate={currentDate || ''}
        onDateChange={handleDateChange}
        searchParams={baseParams}
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
