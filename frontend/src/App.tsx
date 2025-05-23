import React, { useState } from 'react';
import FireMap from './components/FireMap';
import { FirePoint, SearchParams } from './types';
import './App.css';

const App: React.FC = () => {
  const [firePoints, setFirePoints] = useState<FirePoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (params: SearchParams) => {
    setLoading(true);
    setError(null);
    setFirePoints([]); // 清除之前的点

    try {
      const queryParams = new URLSearchParams();
      if (params.mode === 'country') {
        queryParams.append('country', params.country!);
      } else {
        queryParams.append('west', params.west!.toString());
        queryParams.append('south', params.south!.toString());
        queryParams.append('east', params.east!.toString());
        queryParams.append('north', params.north!.toString());
      }
      queryParams.append('start_date', params.startDate);
      queryParams.append('end_date', params.endDate);

      const response = await fetch(`http://localhost:8000/fires?${queryParams}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to fetch fire data');
      }

      const data = await response.json();
      console.log('Received data:', data);
      setFirePoints(data);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <FireMap firePoints={firePoints} onSearch={handleSearch} />
      {error && (
        <div className="absolute top-20 left-4 z-[1000] p-4 bg-red-100 text-red-700 rounded shadow-lg">
          {error}
        </div>
      )}
      {loading && (
        <div className="absolute top-20 left-4 z-[1000] p-4 bg-blue-100 text-blue-700 rounded shadow-lg">
          Loading...
        </div>
      )}
    </div>
  );
};

export default App;
