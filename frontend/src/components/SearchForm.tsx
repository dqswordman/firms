import React, { useState } from 'react';

interface SearchFormProps {
  onSearch: (params: SearchParams) => void;
}

interface SearchParams {
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
        alert('请输入完整的坐标范围');
        return;
      }
      params.west = parseFloat(west);
      params.south = parseFloat(south);
      params.east = parseFloat(east);
      params.north = parseFloat(north);
    }

    if (!startDate || !endDate) {
      alert('请选择日期范围');
      return;
    }

    onSearch(params);
  };

  return (
    <form onSubmit={handleSubmit} className="search-form">
      <div className="form-group">
        <label>查询模式：</label>
        <div className="radio-group">
          <label>
            <input
              type="radio"
              value="country"
              checked={mode === 'country'}
              onChange={(e) => setMode(e.target.value as 'country')}
            />
            按国家查询
          </label>
          <label>
            <input
              type="radio"
              value="bbox"
              checked={mode === 'bbox'}
              onChange={(e) => setMode(e.target.value as 'bbox')}
            />
            按坐标查询
          </label>
        </div>
      </div>

      {mode === 'country' ? (
        <div className="form-group">
          <label>国家代码：</label>
          <input
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="输入 ISO3 国家代码 (例如: USA)"
            maxLength={3}
          />
        </div>
      ) : (
        <div className="form-group coordinates">
          <div className="coordinate-row">
            <div>
              <label>西经：</label>
              <input
                type="number"
                value={west}
                onChange={(e) => setWest(e.target.value)}
                placeholder="West"
                min="-180"
                max="180"
                step="0.000001"
              />
            </div>
            <div>
              <label>东经：</label>
              <input
                type="number"
                value={east}
                onChange={(e) => setEast(e.target.value)}
                placeholder="East"
                min="-180"
                max="180"
                step="0.000001"
              />
            </div>
          </div>
          <div className="coordinate-row">
            <div>
              <label>南纬：</label>
              <input
                type="number"
                value={south}
                onChange={(e) => setSouth(e.target.value)}
                placeholder="South"
                min="-90"
                max="90"
                step="0.000001"
              />
            </div>
            <div>
              <label>北纬：</label>
              <input
                type="number"
                value={north}
                onChange={(e) => setNorth(e.target.value)}
                placeholder="North"
                min="-90"
                max="90"
                step="0.000001"
              />
            </div>
          </div>
        </div>
      )}

      <div className="form-group date-range">
        <div>
          <label>开始日期：</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div>
          <label>结束日期：</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      <button type="submit" className="search-button">
        查询
      </button>
    </form>
  );
};

export default SearchForm; 