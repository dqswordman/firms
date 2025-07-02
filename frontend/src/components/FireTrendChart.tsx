import React, { useMemo, useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  ChartOptions,
  TimeUnit,
  ChartData,
  ChartTypeRegistry,
  LineController
} from 'chart.js';
import { format, eachDayOfInterval, startOfDay, endOfDay } from 'date-fns';
import 'chartjs-adapter-date-fns';
import { FirePoint } from '../types';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  LineController
);

interface DailyStats {
  date: Date;
  count: number;
  totalFrp: number;
}

interface FireTrendChartProps {
  firePoints: FirePoint[];
  startDate: Date;
  endDate: Date;
}

type ChartDataType = ChartData<'line', { x: Date; y: number }[], unknown>;

const FireTrendChart: React.FC<FireTrendChartProps> = ({ firePoints, startDate, endDate }) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<ChartJS<'line', { x: Date; y: number }[], unknown> | null>(null);

  // Calculate daily statistics using useMemo
  const dailyStats = useMemo(() => {
    if (firePoints.length === 0) return [];

    const allDays = eachDayOfInterval({
      start: startOfDay(startDate),
      end: endOfDay(endDate)
    });

    const statsMap = new Map(
      allDays.map(date => [
        format(date, 'yyyy-MM-dd'),
        { date, count: 0, totalFrp: 0 }
      ])
    );

    firePoints.forEach(point => {
      const dateStr = point.acq_date;
      const stats = statsMap.get(dateStr);
      if (stats) {
        stats.count += 1;
        if (point.frp) {
          stats.totalFrp += parseFloat(point.frp);
        }
      }
    });

    return Array.from(statsMap.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [firePoints, startDate, endDate]);

  // Prepare chart data
  const chartData = useMemo<ChartDataType>(() => ({
    datasets: [
      {
        label: 'Fire Point Count',
        data: dailyStats.map(stat => ({
          x: stat.date,
          y: stat.count
        })),
        borderColor: 'rgb(255, 99, 71)',
        backgroundColor: 'rgba(255, 99, 71, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 5,
        yAxisID: 'count'
      },
      {
        label: 'Average FRP (MW)',
        data: dailyStats.map(stat => ({
          x: stat.date,
          y: stat.count > 0 ? stat.totalFrp / stat.count : 0
        })),
        borderColor: 'rgb(255, 165, 0)',
        backgroundColor: 'rgba(255, 165, 0, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 5,
        yAxisID: 'frp'
      }
    ]
  }), [dailyStats]);

  // Chart options
  const options = useMemo<ChartOptions<'line'>>(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      title: {
        display: true,
        text: 'Fire Point Count and Average Radiative Power Trend'
      },
      tooltip: {
        callbacks: {
          title: (items: any) => {
            if (items.length > 0) {
              const date = new Date(items[0].parsed.x);
              return format(date, 'yyyy-MM-dd');
            }
            return '';
          }
        }
      }
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'day' as TimeUnit,
          tooltipFormat: 'yyyy-MM-dd',
          displayFormats: {
            day: 'MM-dd'
          }
        },
        title: {
          display: true,
          text: 'Date'
        }
      },
      count: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Fire Point Count'
        }
      },
      frp: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Average FRP (MW)'
        },
        grid: {
          drawOnChartArea: false
        }
      }
    }
  }), []);

  // Initialize and update chart
  useEffect(() => {
    let chart: ChartJS<'line', { x: Date; y: number }[], unknown> | null = null;

    const initChart = () => {
      if (!chartRef.current || dailyStats.length === 0) return;

      const ctx = chartRef.current.getContext('2d');
      if (!ctx) return;

      // Destroy existing chart if it exists
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }

      // Create new chart
      chart = new ChartJS<'line', { x: Date; y: number }[], unknown>(ctx, {
        type: 'line',
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
  }, [chartData, options, dailyStats]);

  if (firePoints.length === 0) {
    return null;
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-lg">
      <div style={{ position: 'relative', width: '100%', height: '400px' }}>
        <canvas ref={chartRef} />
      </div>
    </div>
  );
};

export default React.memo(FireTrendChart); 