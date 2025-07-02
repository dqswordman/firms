import React, { useMemo, useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData,
  ChartTypeRegistry,
  RadarController
} from 'chart.js';
import { FirePoint } from '../types';

// Register Chart.js components
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  RadarController
);

interface FireRadarChartProps {
  firePoints: FirePoint[];
}

type ChartDataType = ChartData<'radar', number[], unknown>;

const FireRadarChart: React.FC<FireRadarChartProps> = ({ firePoints }) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<ChartJS<'radar', number[], unknown> | null>(null);

  const stats = useMemo(() => {
    if (firePoints.length === 0) return null;

    const totalPoints = firePoints.length;

    // FRP (Fire Radiative Power) levels with adjusted thresholds
    const frpStats = {
      high: firePoints.filter(point => point.frp && parseFloat(point.frp) >= 20).length,    // Changed from 50 to 20
      medium: firePoints.filter(point => point.frp && parseFloat(point.frp) >= 5 && parseFloat(point.frp) < 20).length,  // Changed from 10-50 to 5-20
      low: firePoints.filter(point => point.frp && parseFloat(point.frp) < 5).length        // Changed from <10 to <5
    };

    // Day/Night distribution
    const dayNightStats = {
      day: firePoints.filter(point => point.daynight === 'D').length,
      night: firePoints.filter(point => point.daynight === 'N').length
    };

    // Normalize all values to percentages
    return {
      frp: {
        high: (frpStats.high / totalPoints) * 100,
        medium: (frpStats.medium / totalPoints) * 100,
        low: (frpStats.low / totalPoints) * 100
      },
      dayNight: {
        day: (dayNightStats.day / totalPoints) * 100,
        night: (dayNightStats.night / totalPoints) * 100
      }
    };
  }, [firePoints]);

  // Prepare chart data
  const chartData = useMemo<ChartDataType>(() => ({
    labels: [
      'High FRP',
      'Medium FRP',
      'Low FRP',
      'Day',
      'Night'
    ],
    datasets: [
      {
        label: 'Fire Point Distribution',
        data: stats ? [
          stats.frp.high,
          stats.frp.medium,
          stats.frp.low,
          stats.dayNight.day,
          stats.dayNight.night
        ] : [],
        backgroundColor: 'rgba(255, 99, 71, 0.2)',
        borderColor: 'rgb(255, 99, 71)',
        borderWidth: 2,
        pointBackgroundColor: 'rgb(255, 99, 71)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(255, 99, 71)'
      }
    ]
  }), [stats]);

  // Chart options
  const options = useMemo<ChartOptions<'radar'>>(() => ({
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        angleLines: {
          display: true
        },
        suggestedMin: 0,
        suggestedMax: 100,
        ticks: {
          callback: (value) => `${value}%`,
          stepSize: 20
        }
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || '';
            const value = context.raw as number;
            return `${label}: ${value.toFixed(1)}%`;
          }
        }
      },
      title: {
        display: true,
        text: 'Fire Point Analysis',
        font: {
          size: 16
        }
      }
    }
  }), []);

  // Initialize and update chart
  useEffect(() => {
    let chart: ChartJS<'radar', number[], unknown> | null = null;

    const initChart = () => {
      if (!chartRef.current || !stats) return;

      const ctx = chartRef.current.getContext('2d');
      if (!ctx) return;

      // Destroy existing chart if it exists
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }

      // Create new chart
      chart = new ChartJS<'radar', number[], unknown>(ctx, {
        type: 'radar',
        data: chartData,
        options: options
      });

      chartInstance.current = chart;
    };

    // Initialize chart
    initChart();

    // Cleanup
    return () => {
      if (chart) {
        chart.destroy();
        chart = null;
      }
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [chartData, options, stats]);

  if (!stats) {
    return null;
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold mb-4">Fire Point Distribution Analysis</h3>
      <div style={{ position: 'relative', width: '100%', height: '400px' }}>
        <canvas ref={chartRef} />
      </div>
    </div>
  );
};

export default React.memo(FireRadarChart); 