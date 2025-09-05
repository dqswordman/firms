import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { SearchParams } from '../types';
import { Slider } from '@mui/material';

interface TimeSliderProps {
  dates: string[];
  currentDate: string;
  onTimeChange: (date: string) => void;
  params: SearchParams;
  onQuickRange?: (token: 'today' | '24h' | '48h' | '7d' | 'week') => void;
  onRangeChange?: (start: string, end: string) => void;
}

const TimeSlider: React.FC<TimeSliderProps> = ({ dates, currentDate, onTimeChange, params, onQuickRange, onRangeChange }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [range, setRange] = useState<[number, number]>([0, Math.max(0, (dates?.length || 1) - 1)]);
  // All data for the range is loaded once; slider only filters client-side.

  // Update slider position when the date list or current date changes
  useEffect(() => {
    if (dates.length > 0) {
      const index = dates.indexOf(currentDate);
      if (index !== -1) {
        setCurrentIndex(index);
      }
      setRange([0, dates.length - 1]);
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
    const maxIndex = range[1] ?? (dates.length - 1);
    if (currentIndex < Math.min(dates.length - 1, maxIndex)) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      onTimeChange(dates[newIndex]);
    }
  };

  const handleRangeChange = (_: any, val: number | number[]) => {
    if (!Array.isArray(val)) return;
    const v: [number, number] = [Math.min(val[0], val[1]), Math.max(val[0], val[1])] as [number, number];
    setRange(v);
    const [s, e] = v;
    onRangeChange?.(dates[s], dates[e]);
    // keep current index within range
    if (currentIndex < s) {
      setCurrentIndex(s);
      onTimeChange(dates[s]);
    } else if (currentIndex > e) {
      setCurrentIndex(e);
      onTimeChange(dates[e]);
    }
  };

  if (dates.length === 0) return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white/95 border-t border-gray-200 shadow-lg z-[1000] p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <button onClick={handlePrevious} disabled={currentIndex === 0} className="px-2 py-1 rounded bg-slate-800 text-white disabled:opacity-50">Prev</button>
            <button onClick={handleNext} disabled={currentIndex === dates.length - 1} className="px-2 py-1 rounded bg-slate-800 text-white disabled:opacity-50">Next</button>
            <div className="ml-4 hidden md:flex gap-2">
              <button onClick={() => onQuickRange?.('today')} className="px-2 py-1 rounded border">Today</button>
              <button onClick={() => onQuickRange?.('24h')} className="px-2 py-1 rounded border">24H</button>
              <button onClick={() => onQuickRange?.('48h')} className="px-2 py-1 rounded border">48H</button>
              <button onClick={() => onQuickRange?.('7d')} className="px-2 py-1 rounded border">7D</button>
              <button onClick={() => onQuickRange?.('week')} className="px-2 py-1 rounded border">WEEK</button>
            </div>
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
        {/* Range selection (visual sub-interval) */}
        <div className="w-full mb-2">
          <Slider
            size="small"
            value={range}
            onChange={handleRangeChange}
            min={0}
            max={dates.length - 1}
            valueLabelDisplay="off"
            sx={{ color: '#f59e0b' }}
          />
        </div>

        <div className="w-full">
          <input
            type="range"
            min={range[0]}
            max={range[1]}
            value={currentIndex}
            onChange={handleSliderChange}
            className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer thumb-blue"
          />
          {/* Adaptive ticks row */}
          <div className="flex justify-between text-[10px] text-gray-500 mt-1">
            {dates.map((d, i) => {
              const dt = new Date(d);
              const total = dates.length;
              const isFirst = i === 0;
              const isLast = i === total - 1;
              const isMonthStart = dt.getDate() === 1;
              // choose granularity
              let show = false;
              let fmt = 'MM/dd';
              if (total <= 14) {
                show = true;
              } else if (total <= 60) {
                // every 7 days + month starts
                show = isMonthStart || (i % 7 === 0) || isFirst || isLast;
              } else {
                // only month starts + ends
                show = isMonthStart || isFirst || isLast;
                fmt = isMonthStart && !isFirst ? 'MMM' : 'MM/dd';
              }
              const isActive = i === currentIndex;
              return (
                <span key={d + i} className={(isActive ? 'font-bold text-blue-600' : '') + ' select-none'}>
                  {show ? format(dt, fmt, { locale: enUS }) : ''}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeSlider;
