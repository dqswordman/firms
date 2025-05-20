import React, { useState, useEffect } from 'react';
import { FirePoint } from '../types';

interface TimeSliderProps {
  dates: string[];
  currentDate: string;
  onTimeChange: (date: string) => void;
}

const TimeSlider: React.FC<TimeSliderProps> = ({ dates, currentDate, onTimeChange }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
  const [currentIndex, setCurrentIndex] = useState(dates.indexOf(currentDate));

  useEffect(() => {
    setCurrentIndex(dates.indexOf(currentDate));
  }, [currentDate, dates]);

  // 播放动画
  useEffect(() => {
    if (isPlaying) {
      const id = setInterval(() => {
        setCurrentIndex(prevIndex => {
          const newIndex = prevIndex + 1;
          if (newIndex >= dates.length) {
            setIsPlaying(false);
             if (intervalId) {
              clearInterval(intervalId);
              setIntervalId(null);
            }
            return prevIndex; // Stay at the last date
          }
          const newDate = dates[newIndex];
          onTimeChange(newDate);
          return newIndex;
        });
      }, 1000); // 每秒更新一次
      setIntervalId(id);
    } else {
      if (intervalId) {
        clearInterval(intervalId);
        setIntervalId(null);
      }
    }
    // Cleanup function for the effect
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isPlaying, dates, onTimeChange, intervalId]);

  const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const index = parseInt(event.target.value);
    setCurrentIndex(index);
    const date = dates[index];
    onTimeChange(date);
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      const newDate = dates[newIndex];
      onTimeChange(newDate);
    }
  };

  const handleNext = () => {
    if (currentIndex < dates.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      const newDate = dates[newIndex];
      onTimeChange(newDate);
    }
  };

  const formatDate = (dateStr: string) => {
    // Assuming dateStr is in 'YYYY-MM-DD' format
    const [year, month, day] = dateStr.split('-');
    return `${year}年${month}月${day}日`;
  };

  if (dates.length === 0) return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-[1000] p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrevious}
              className="p-3 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              disabled={currentIndex === 0}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            <button
              onClick={togglePlay}
              className="p-3 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              {isPlaying ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              )}
            </button>
            <button
              onClick={handleNext}
              className="p-3 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              disabled={currentIndex === dates.length - 1}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-800 font-semibold text-lg">
              {currentDate ? formatDate(currentDate) : ''}
            </span>
            <span className="text-gray-600 text-sm">
              {currentIndex + 1} / {dates.length}
            </span>
          </div>
        </div>
        <input
          type="range"
          min="0"
          max={dates.length > 0 ? dates.length - 1 : 0}
          value={currentIndex}
          onChange={handleSliderChange}
          className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer thumb-blue"
        />
      </div>
    </div>
  );
};

export default TimeSlider; 