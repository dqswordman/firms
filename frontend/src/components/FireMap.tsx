import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import FireHeatmap from './FireHeatmap';
import SearchForm from './SearchForm';
import TimeSlider from './TimeSlider';
import { FirePoint } from '../types';

interface FireMapProps {
  firePoints: FirePoint[];
  onSearch: (params: any) => void;
}

const FireMap: React.FC<FireMapProps> = ({ firePoints, onSearch }) => {
  const [filteredPoints, setFilteredPoints] = useState<FirePoint[]>([]);
  const [dates, setDates] = useState<string[]>([]);
  const [currentDate, setCurrentDate] = useState<string>('');

  // 提取并排序唯一日期
  useEffect(() => {
    if (firePoints.length > 0) {
      const uniqueDates = Array.from(new Set(firePoints.map(point => point.acq_date)))
        .sort();
      setDates(uniqueDates);
      if (uniqueDates.length > 0 && !currentDate) {
        setCurrentDate(uniqueDates[0]);
      }
    } else {
      setDates([]);
      setCurrentDate('');
    }
  }, [firePoints]);

  // 根据当前日期过滤点
  useEffect(() => {
    if (currentDate && firePoints.length > 0) {
      const filtered = firePoints.filter(point => point.acq_date === currentDate);
      setFilteredPoints(filtered);
      console.log('FireMap filtered points for date', currentDate, ':', filtered);
    } else {
      setFilteredPoints([]);
    }
  }, [currentDate, firePoints]);

  const handleTimeChange = (date: string) => {
    setCurrentDate(date);
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="absolute top-4 left-4 z-[1000] bg-white p-4 rounded-lg shadow-lg">
        <SearchForm onSearch={onSearch} />
      </div>
      <MapContainer
        center={[35.0, 105.0]}
        zoom={4}
        className="flex-grow w-full"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {filteredPoints.length > 0 && <FireHeatmap firePoints={filteredPoints} />}
      </MapContainer>
      {firePoints.length > 0 && dates.length > 0 && (
        <TimeSlider
          dates={dates}
          currentDate={currentDate}
          onTimeChange={handleTimeChange}
        />
      )}
    </div>
  );
};

export default FireMap; 