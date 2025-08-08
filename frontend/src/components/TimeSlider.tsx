import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { SearchParams } from '../types';
import { useQueryClient } from '@tanstack/react-query';
import { prefetchFires } from '../hooks/useFiresQuery';

interface TimeSliderProps {
  dates: string[];
  currentDate: string;
  onTimeChange: (date: string) => void;
  params: SearchParams;
}

const TimeSlider: React.FC<TimeSliderProps> = ({ dates, currentDate, onTimeChange, params }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const queryClient = useQueryClient();

  // Prefetch adjacent dates to improve slider performance
  useEffect(() => {
    if (dates.length === 0 || !currentDate) return;
    const index = dates.indexOf(currentDate);
    const prevDate = dates[index - 1];
    const nextDate = dates[index + 1];
    if (prevDate) {
      prefetchFires(queryClient, {
        ...params,
        startDate: prevDate,
        endDate: prevDate,
      });
    }
    if (nextDate) {
      prefetchFires(queryClient, {
        ...params,
        startDate: nextDate,
        endDate: nextDate,
      });
    }
  }, [currentDate, dates, params, queryClient]);

  // Update slider position when the date list or current date changes
  useEffect(() => {
    if (dates.length > 0) {
      const index = dates.indexOf(currentDate);
      if (index !== -1) {
        setCurrentIndex(index);
      }
    }
  }, [dates, currentDate]);

  const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const index = parseInt(event.target.value);
    if (index >= 0 && index < dates.length) {
      setCurrentIndex(index);
      onTimeChange(dates[index]);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      onTimeChange(dates[newIndex]);
    }
  };

  const handleNext = () => {
    if (currentIndex < dates.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      onTimeChange(dates[newIndex]);
    }
  };

  if (dates.length === 0) return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-[1000] p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            <button
              onClick={handleNext}
              disabled={currentIndex === dates.length - 1}
              className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-800 font-semibold text-lg">
              {currentDate ? format(new Date(currentDate), 'MMMM d, yyyy', { locale: enUS }) : ''}
            </span>
            <span className="text-gray-600 text-sm">
              {currentIndex + 1} / {dates.length}
            </span>
          </div>
        </div>
        <input
          type="range"
          min="0"
          max={dates.length - 1}
          value={currentIndex}
          onChange={handleSliderChange}
          className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer thumb-blue"
        />
      </div>
    </div>
  );
};

export default TimeSlider;
