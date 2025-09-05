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
import { FirePoint, SearchParams } from '../types';
import { toast } from 'react-toastify';

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
  firePoints: FirePoint[]; // current-day (fallback)
  startDate: Date;
  endDate: Date;
  params: SearchParams;
  allPoints?: FirePoint[]; // optional: full-range points to avoid refetch
  viewStartDate?: Date; // optional: restrict to selected view range
  viewEndDate?: Date;   // optional: restrict to selected view range
}

type ChartDataType = ChartData<'line', { x: Date; y: number }[], unknown>;

const FireTrendChart: React.FC<FireTrendChartProps> = ({ firePoints, startDate, endDate, params, allPoints, viewStartDate, viewEndDate }) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<ChartJS<'line', { x: Date; y: number }[], unknown> | null>(null);
  const [seriesPoints, setSeriesPoints] = React.useState<FirePoint[]>(allPoints ?? []);
  const [loading, setLoading] = React.useState(false);

  // Fetch full-range data for time series (JSON for lighter payload)
  useEffect(() => {
    if (allPoints && allPoints.length > 0) {
      setSeriesPoints(allPoints);
      return;
    }
    let aborted = false;
    const fetchSeries = async () => {
      if (!params) return;
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (params.mode === 'country' && params.country) {
          queryParams.append('country', params.country);
        } else if (params.mode === 'bbox' && params.west != null && params.south != null && params.east != null && params.north != null) {
          queryParams.append('west', params.west.toString());
          queryParams.append('south', params.south.toString());
          queryParams.append('east', params.east.toString());
          queryParams.append('north', params.north.toString());
        }
        queryParams.append('start_date', params.startDate);
        queryParams.append('end_date', params.endDate);
        if (params.sourcePriority) queryParams.append('sourcePriority', params.sourcePriority);
        queryParams.append('format', 'json');

        const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
        const res = await fetch(`${baseUrl}/fires?${queryParams.toString()}`);
        if (!res.ok) throw new Error(`Failed to fetch series: ${res.status}`);
        const data: FirePoint[] = await res.json();
        if (!aborted) setSeriesPoints(data);
      } catch (err: any) {
        if (!aborted) toast.error(err?.message || '获取趋势数据失败');
      } finally {
        if (!aborted) setLoading(false);
      }
    };
    fetchSeries();
    return () => { aborted = true; };
  }, [params, allPoints]);

  // Calculate daily statistics using useMemo
  const dailyStats = useMemo(() => {
    const points = seriesPoints.length > 0 ? seriesPoints : firePoints;
    if (points.length === 0) return [];

    const startD = startOfDay(viewStartDate || startDate);
    const endD = endOfDay(viewEndDate || endDate);
    const allDays = eachDayOfInterval({ start: startD, end: endD });

    const statsMap = new Map(
      allDays.map(date => [
        format(date, 'yyyy-MM-dd'),
        { date, count: 0, totalFrp: 0 }
      ])
    );

    points.forEach(point => {
      const dateStr = point.acq_date;
      if (!dateStr) return;
      const stats = statsMap.get(dateStr);
      if (stats) {
        stats.count += 1;
        if (point.frp) {
          const frpVal = typeof point.frp === 'number' ? point.frp : parseFloat(point.frp);
          if (!isNaN(frpVal)) stats.totalFrp += frpVal;
        }
      }
    });

    return Array.from(statsMap.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [firePoints, seriesPoints, startDate, endDate, viewStartDate, viewEndDate]);
  

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
    animation: false,
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

  // Initialize chart once, then update data without destroy to avoid jitter
  useEffect(() => {
    const ctx = chartRef.current?.getContext('2d');
    if (!ctx) return;
    if (!chartInstance.current) {
      chartInstance.current = new ChartJS<'line', { x: Date; y: number }[], unknown>(ctx, {
        type: 'line',
        data: chartData,
        options: options,
      });
    }
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [options]);

  // Update chart data when stats change
  useEffect(() => {
    const inst = chartInstance.current;
    if (!inst) return;
    inst.data = chartData as any;
    inst.update('none');
  }, [chartData]);

  return (
    <div className="bg-white p-4 rounded-lg shadow-lg">
      <div style={{ position: 'relative', width: '100%', height: '400px' }}>
        <canvas ref={chartRef} />
      </div>
    </div>
  );
};

export default React.memo(FireTrendChart); 
