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

      const url = `http://localhost:8000/fires?${queryParams}`;
      console.log('Fetching from URL:', url);
      
      // Use fetch with explicit CORS mode
      const response = await fetch(url, {
        mode: 'cors',
        headers: {
          'Accept': 'application/json'
        }
      });
      console.log('Raw response status:', response.status);
      console.log('Raw response headers:', Array.from(response.headers.entries()));
      
      const responseText = await response.text();
      console.log('Raw response text:', responseText);
      
      if (!response.ok) {
        try {
          const error = JSON.parse(responseText);
          throw new Error(error.detail || 'Failed to fetch fire data');
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
      }

      // Check if response is empty
      if (!responseText.trim()) {
        console.warn('Empty response received from server');
        setFirePoints([]);
        return;
      }

      let data;
      try {
        data = JSON.parse(responseText);
        console.log('Successfully parsed JSON data');
      } catch (parseError) {
        console.error('Error parsing JSON response:', parseError);
        console.error('Response text that failed to parse:', responseText);
        throw new Error('Invalid data format received from server');
      }
      
      console.log('Parsed data:', data);
      
      if (!Array.isArray(data)) {
        console.error('Expected array data but received:', typeof data, data);
        throw new Error('Expected array data but received different format');
      }
      
      // Validate some required fields in the first item if it exists
      if (data.length > 0) {
        const firstItem = data[0];
        console.log('First data item:', firstItem);
        
        const requiredFields = ['latitude', 'longitude', 'acq_date'];
        const missingFields = requiredFields.filter(field => !firstItem[field]);
        
        if (missingFields.length > 0) {
          console.warn('Missing required fields in data:', missingFields);
        }
      }
      
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
