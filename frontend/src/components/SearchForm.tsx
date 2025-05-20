import React, { useState } from 'react';

interface SearchFormProps {
  onSearch: (params: SearchParams) => void;
}

export interface SearchParams {
  mode: 'country' | 'bbox';
  country?: string;
  west?: number;
  south?: number;
  east?: number;
  north?: number;
  startDate: string;
  endDate: string;
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const params: SearchParams = {
      mode,
      startDate,
      endDate,
    };

    if (mode === 'country') {
      if (!country) {
        alert('请输入国家代码');
        return;
      }
      params.country = country.toUpperCase();
    } else {
      if (!west || !south || !east || !north) {
        alert('请输入完整的地理边界坐标');
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
        <label className="block mb-2">查询模式：</label>
        <div className="flex gap-4">
          <label>
            <input
              type="radio"
              value="country"
              checked={mode === 'country'}
              onChange={(e) => setMode(e.target.value as 'country')}
              className="mr-2"
            />
            国家代码
          </label>
          <label>
            <input
              type="radio"
              value="bbox"
              checked={mode === 'bbox'}
              onChange={(e) => setMode(e.target.value as 'bbox')}
              className="mr-2"
            />
            地理边界
          </label>
        </div>
      </div>

      {mode === 'country' ? (
        <div className="mb-4">
          <label className="block mb-2">国家代码（3位大写字母）：</label>
          <input
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="例如：USA"
            maxLength={3}
          />
        </div>
      ) : (
        <div className="mb-4">
          <label className="block mb-2">地理边界坐标：</label>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="number"
              value={west}
              onChange={(e) => setWest(e.target.value)}
              className="p-2 border rounded"
              placeholder="西经"
              step="any"
            />
            <input
              type="number"
              value={south}
              onChange={(e) => setSouth(e.target.value)}
              className="p-2 border rounded"
              placeholder="南纬"
              step="any"
            />
            <input
              type="number"
              value={east}
              onChange={(e) => setEast(e.target.value)}
              className="p-2 border rounded"
              placeholder="东经"
              step="any"
            />
            <input
              type="number"
              value={north}
              onChange={(e) => setNorth(e.target.value)}
              className="p-2 border rounded"
              placeholder="北纬"
              step="any"
            />
          </div>
        </div>
      )}

      <div className="mb-4">
        <label className="block mb-2">日期范围：</label>
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

      <button
        type="submit"
        className="w-full p-2 text-white bg-blue-500 rounded hover:bg-blue-600"
      >
        查询
      </button>
    </form>
  );
};

export default SearchForm; 