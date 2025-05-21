import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import { FirePoint } from '../types';

// 注册 Chart.js 组件
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

interface FireRadarChartProps {
  firePoints: FirePoint[];
}

const FireRadarChart: React.FC<FireRadarChartProps> = ({ firePoints }) => {
  // 计算统计数据
  const stats = useMemo(() => {
    // 亮度 (TI4) 统计 - 根据昼夜区分阈值
    const ti4Stats = {
      high: 0,    // 昼: >= 360K, 夜: >= 355K
      medium: 0,  // 昼: >= 320K, 夜: >= 315K
      low: 0,     // 其他
    };

    // 亮度 (TI5) 统计 - 根据昼夜区分阈值，比TI4低约25K
    const ti5Stats = {
      high: 0,    // 昼: >= 335K, 夜: >= 330K
      medium: 0,  // 昼: >= 295K, 夜: >= 290K
      low: 0,     // 其他
    };

    // 置信度统计
    const confidenceStats = {
      high: 0,    // h 或 >= 80
      medium: 0,  // n 或 30-80
      low: 0,     // l 或 < 30
    };

    // FRP (Fire Radiative Power) 统计
    const frpStats = {
      high: 0,    // >= 50 MW
      medium: 0,  // >= 10 MW
      low: 0,     // < 10 MW
    };

    // 卫星类型统计
    const satelliteStats = {
      VIIRS: 0,   // NPP/N20/N21
      Terra: 0,   // Terra
      Aqua: 0,    // Aqua
    };

    // 昼夜统计
    const daynightStats = {
      day: 0,     // D
      night: 0,   // N
    };

    // 扫描统计
    const scanStats = {
      high: 0,    // > 0.60
      medium: 0,  // >= 0.40
      low: 0,     // < 0.40
    };

    firePoints.forEach(point => {
      const isDay = point.daynight === 'D';
      
      // 统计 TI4
      const ti4 = parseFloat(point.bright_ti4);
      if (isDay) {
        if (ti4 >= 360) ti4Stats.high++;
        else if (ti4 >= 320) ti4Stats.medium++;
        else ti4Stats.low++;
      } else {
        if (ti4 >= 355) ti4Stats.high++;
        else if (ti4 >= 315) ti4Stats.medium++;
        else ti4Stats.low++;
      }

      // 统计 TI5
      const ti5 = parseFloat(point.bright_ti5);
      if (isDay) {
        if (ti5 >= 335) ti5Stats.high++;
        else if (ti5 >= 295) ti5Stats.medium++;
        else ti5Stats.low++;
      } else {
        if (ti5 >= 330) ti5Stats.high++;
        else if (ti5 >= 290) ti5Stats.medium++;
        else ti5Stats.low++;
      }

      // 统计置信度
      const confidence = point.confidence.toLowerCase();
      if (confidence === 'h' || (confidence.match(/^\d+$/) && parseInt(confidence) >= 80)) {
        confidenceStats.high++;
      } else if (confidence === 'n' || (confidence.match(/^\d+$/) && parseInt(confidence) >= 30)) {
        confidenceStats.medium++;
      } else {
        confidenceStats.low++;
      }

      // 统计 FRP
      const frp = parseFloat(point.frp);
      if (frp >= 50) frpStats.high++;
      else if (frp >= 10) frpStats.medium++;
      else frpStats.low++;

      // 统计卫星类型
      const satellite = point.satellite.toUpperCase();
      if (satellite.startsWith('N')) {
        satelliteStats.VIIRS++;
      } else if (satellite === 'T') {
        satelliteStats.Terra++;
      } else {
        satelliteStats.Aqua++;
      }

      // 统计昼夜
      if (point.daynight === 'D') daynightStats.day++;
      else daynightStats.night++;

      // 统计扫描
      const scan = parseFloat(point.scan);
      if (scan > 0.60) scanStats.high++;
      else if (scan >= 0.40) scanStats.medium++;
      else scanStats.low++;
    });

    return {
      ti4Stats,
      ti5Stats,
      confidenceStats,
      frpStats,
      satelliteStats,
      daynightStats,
      scanStats,
    };
  }, [firePoints]);

  // 准备雷达图数据
  const chartData = {
    labels: [
      '高亮度(TI4)', '中亮度(TI4)', '低亮度(TI4)',
      '高亮度(TI5)', '中亮度(TI5)', '低亮度(TI5)',
      '高置信度', '中置信度', '低置信度',
      '高FRP(≥50MW)', '中FRP(≥10MW)', '低FRP(<10MW)',
      'VIIRS', 'Terra', 'Aqua',
      '白天', '夜间',
      '高扫描(>0.60)', '中扫描(≥0.40)', '低扫描(<0.40)'
    ],
    datasets: [
      {
        label: '火灾点分布',
        data: [
          stats.ti4Stats.high, stats.ti4Stats.medium, stats.ti4Stats.low,
          stats.ti5Stats.high, stats.ti5Stats.medium, stats.ti5Stats.low,
          stats.confidenceStats.high, stats.confidenceStats.medium, stats.confidenceStats.low,
          stats.frpStats.high, stats.frpStats.medium, stats.frpStats.low,
          stats.satelliteStats.VIIRS, stats.satelliteStats.Terra, stats.satelliteStats.Aqua,
          stats.daynightStats.day, stats.daynightStats.night,
          stats.scanStats.high, stats.scanStats.medium, stats.scanStats.low
        ],
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
        pointBackgroundColor: 'rgba(255, 99, 132, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(255, 99, 132, 1)',
      },
    ],
  };

  const options = {
    scales: {
      r: {
        angleLines: {
          display: true,
        },
        suggestedMin: 0,
        suggestedMax: Math.max(
          ...chartData.datasets[0].data
        ) * 1.2,
        ticks: {
          stepSize: 1,
          precision: 0
        }
      },
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || '';
            const value = context.raw;
            const total = firePoints.length;
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold mb-4">火灾点分布统计</h3>
      <div className="w-full h-[400px]">
        <Radar data={chartData} options={options} />
      </div>
    </div>
  );
};

export default FireRadarChart; 