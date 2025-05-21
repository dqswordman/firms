import React, { useState, useEffect } from 'react';
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
  TimeUnit
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { format, eachDayOfInterval, startOfDay, endOfDay } from 'date-fns';
import 'chartjs-adapter-date-fns';
import { FirePoint } from '../types';

// 注册 Chart.js 组件
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
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

const FireTrendChart: React.FC<FireTrendChartProps> = ({ firePoints, startDate, endDate }) => {
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);

  // 计算每日统计数据
  useEffect(() => {
    // 生成日期范围内的所有日期
    const allDays = eachDayOfInterval({
      start: startOfDay(startDate),
      end: endOfDay(endDate)
    });

    // 初始化每日统计数据
    const statsMap = new Map(
      allDays.map(date => [
        format(date, 'yyyy-MM-dd'),
        { date, count: 0, totalFrp: 0 }
      ])
    );

    // 统计每日火点数量和总 FRP
    firePoints.forEach(point => {
      const dateStr = point.acq_date;
      const stats = statsMap.get(dateStr);
      if (stats) {
        stats.count += 1;
        stats.totalFrp += parseFloat(point.frp);
      }
    });

    // 转换为数组并排序
    const stats = Array.from(statsMap.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
    setDailyStats(stats);
  }, [firePoints, startDate, endDate]);

  // 图表配置
  const chartData = {
    datasets: [
      {
        label: '火点数量',
        data: dailyStats.map(stat => ({
          x: stat.date,
          y: stat.count
        })),
        borderColor: 'rgb(255, 99, 71)',
        backgroundColor: 'rgba(255, 99, 71, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 5
      },
      {
        label: '平均 FRP (MW)',
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
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      title: {
        display: true,
        text: '火点数量与平均辐射功率趋势'
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
          text: '日期'
        }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: '火点数量'
        }
      },
      frp: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: '平均 FRP (MW)'
        },
        grid: {
          drawOnChartArea: false
        }
      }
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-lg">
      <div className="w-full h-[400px]">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};

export default FireTrendChart; 