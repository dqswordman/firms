import React, { useState } from 'react';
import { SearchParams } from '../types';

interface SearchFormProps {
  onSearch: (params: SearchParams) => void;
}

const SearchForm: React.FC<SearchFormProps> = ({ onSearch }) => {
  const [mode, setMode] = useState<'country' | 'bbox'>('country');
  const [country, setCountry] = useState('');
  const [west, setWest] = useState('');
  const [south, setSouth] = useState('');
  const [east, setEast] = useState('');
  const [north, setNorth] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [format, setFormat] = useState<'geojson' | 'json'>('geojson');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const params: SearchParams = {
      mode,
      startDate,
      endDate,
      source: 'modis',
      format,
    };

    if (mode === 'country') {
      if (!country) {
        alert('Please enter a country code');
        return;
      }
      params.country = country.toUpperCase();
    } else {
      if (!west || !south || !east || !north) {
        alert('Please enter complete geographic boundary coordinates');
        return;
      }
      params.west = parseFloat(west);
      params.south = parseFloat(south);
      params.east = parseFloat(east);
      params.north = parseFloat(north);
    }

    onSearch(params);
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-white rounded shadow">
      <div className="mb-4">
        <label className="block mb-2">Query Mode:</label>
        <div className="flex gap-4">
          <label>
            <input
              type="radio"
              value="country"
              checked={mode === 'country'}
              onChange={(e) => setMode(e.target.value as 'country')}
              className="mr-2"
            />
            Country Code
          </label>
          <label>
            <input
              type="radio"
              value="bbox"
              checked={mode === 'bbox'}
              onChange={(e) => setMode(e.target.value as 'bbox')}
              className="mr-2"
            />
            Geographic Boundary
          </label>
        </div>
      </div>

      {mode === 'country' ? (
        <div className="mb-4">
          <label className="block mb-2">Country Code (3 uppercase letters):</label>
          <input
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="e.g., USA"
            maxLength={3}
          />
        </div>
      ) : (
        <div className="mb-4">
          <label className="block mb-2">Geographic Boundary Coordinates:</label>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="number"
              value={west}
              onChange={(e) => setWest(e.target.value)}
              className="p-2 border rounded"
              placeholder="West Longitude"
              step="any"
            />
            <input
              type="number"
              value={south}
              onChange={(e) => setSouth(e.target.value)}
              className="p-2 border rounded"
              placeholder="South Latitude"
              step="any"
            />
            <input
              type="number"
              value={east}
              onChange={(e) => setEast(e.target.value)}
              className="p-2 border rounded"
              placeholder="East Longitude"
              step="any"
            />
            <input
              type="number"
              value={north}
              onChange={(e) => setNorth(e.target.value)}
              className="p-2 border rounded"
              placeholder="North Latitude"
              step="any"
            />
          </div>
      </div>
    )}

    <div className="mb-4">
      <label className="block mb-2">Date Range:</label>
        <div className="grid grid-cols-2 gap-4">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="p-2 border rounded"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="p-2 border rounded"
        />
      </div>
    </div>

    <div className="mb-4">
      <label className="block mb-2">Data Format:</label>
      <select
        value={format}
        onChange={(e) => setFormat(e.target.value as 'geojson' | 'json')}
        className="w-full p-2 border rounded"
      >
        <option value="geojson">GeoJSON</option>
        <option value="json">JSON (legacy)</option>
      </select>
    </div>

      <button
        type="submit"
        className="w-full p-2 text-white bg-blue-500 rounded hover:bg-blue-600"
      >
        Query
      </button>
    </form>
  );
};

export default SearchForm;
