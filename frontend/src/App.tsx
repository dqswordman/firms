import React, { useState } from 'react';
import './App.css';
import FireMap from './components/FireMap';
import SearchForm from './components/SearchForm';
import './components/SearchForm.css';

interface FireData {
  latitude: number;
  longitude: number;
  acq_date: string;
  acq_time?: string;
  confidence?: string;
  frp?: number;
  [key: string]: any;  // 允许其他可能的字段
}

function App() {
  const [fireData, setFireData] = useState<FireData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (params: any) => {
    setLoading(true);
    setError(null);
    
    try {
      const queryParams = new URLSearchParams();
      
      if (params.mode === 'country') {
        queryParams.append('country', params.country);
      } else {
        queryParams.append('west', params.west.toString());
        queryParams.append('south', params.south.toString());
        queryParams.append('east', params.east.toString());
        queryParams.append('north', params.north.toString());
      }
      
      if (params.startDate) queryParams.append('start_date', params.startDate);
      if (params.endDate) queryParams.append('end_date', params.endDate);

      const url = `http://localhost:8000/fires?${queryParams.toString()}`;
      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Request failed with status ${response.status}`);
      }

      const data = await response.json();
      setFireData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '查询失败');
      setFireData([]); // 清空数据
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Wildfire Visualization</h1>
      </header>
      <main>
        <SearchForm onSearch={handleSearch} />
        {error && <div className="error-message">{error}</div>}
        {loading && <div className="loading-message">加载中...</div>}
        <FireMap fires={fireData} />
      </main>
    </div>
  );
}

export default App;
