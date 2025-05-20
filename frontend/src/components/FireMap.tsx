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

  console.log('FireMap received firePoints:', firePoints);

  // Extract unique dates and sort them
  useEffect(() => {
    if (firePoints.length > 0) {
      const uniqueDates = Array.from(new Set(firePoints.map(point => point.acq_date)))
        .sort();
      setDates(uniqueDates);
      if (uniqueDates.length > 0) {
        const initialDate = uniqueDates[0];
        setCurrentDate(initialDate);
        // Initially filter by the first date
        const initialFiltered = firePoints.filter(point => point.acq_date === initialDate);
        setFilteredPoints(initialFiltered);
        console.log('FireMap initial filtered points:', initialFiltered);
      }
    } else {
      setDates([]);
      setCurrentDate('');
      setFilteredPoints([]);
      console.log('FireMap received empty firePoints or no dates found.');
    }
  }, [firePoints]);

  // Filter points when currentDate changes
  useEffect(() => {
    if (currentDate && firePoints.length > 0) {
      const newFiltered = firePoints.filter(point => point.acq_date === currentDate);
      setFilteredPoints(newFiltered);
      console.log('FireMap filtered points for date', currentDate, ':', newFiltered);
    } else if (firePoints.length > 0 && !currentDate && dates.length > 0) {
       // If currentDate is not set but dates are available (e.g., after initial load)
      const initialDate = dates[0];
      setCurrentDate(initialDate);
       const initialFiltered = firePoints.filter(point => point.acq_date === initialDate);
      setFilteredPoints(initialFiltered);
      console.log('FireMap filtered points for initial date (useEffect):', initialFiltered);
    } else {
      setFilteredPoints([]);
       console.log('FireMap filtering resulted in empty points or no current date.');
    }
  }, [currentDate, firePoints, dates]);

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
        {/* Render FireHeatmap with filtered points */}
        {filteredPoints.length > 0 && <FireHeatmap firePoints={filteredPoints} />}
      </MapContainer>
      {/* Render TimeSlider with dates and current date */}
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