import React, { useMemo } from 'react';
import { FirePoint } from '../types';

interface FireStatsPanelProps {
  firePoints: FirePoint[];
  currentDate: string;
}

const FireStatsPanel: React.FC<FireStatsPanelProps> = ({ firePoints, currentDate }) => {
  const stats = useMemo(() => {
    if (firePoints.length === 0) {
      return {
        totalPoints: 0,
        avgFrp: 0,
        maxFrp: 0,
        dayCount: 0,
        nightCount: 0,
        highConfidence: 0,
        mediumConfidence: 0,
        lowConfidence: 0,
        viirsCount: 0,
        terraCount: 0,
        aquaCount: 0
      };
    }

    let totalFrp = 0;
    let maxFrp = 0;
    let dayCount = 0;
    let nightCount = 0;
    let highConfidence = 0;
    let mediumConfidence = 0;
    let lowConfidence = 0;
    let viirsCount = 0;
    let terraCount = 0;
    let aquaCount = 0;

    firePoints.forEach(point => {
      const frp = point.frp ? parseFloat(point.frp) : 0;
      totalFrp += frp;
      maxFrp = Math.max(maxFrp, frp);

      if (point.daynight === 'D') {
        dayCount++;
      } else {
        nightCount++;
      }

      if (point.confidence) {
        const confidence = point.confidence.toLowerCase();
        if (confidence === 'h' || (confidence.match(/^\d+$/) && parseInt(confidence) >= 80)) {
          highConfidence++;
        } else if (confidence === 'n' || (confidence.match(/^\d+$/) && parseInt(confidence) >= 30)) {
          mediumConfidence++;
        } else {
          lowConfidence++;
        }
      } else {
        // If confidence is undefined, count as low confidence
        lowConfidence++;
      }

      if (point.satellite) {
        const satellite = point.satellite.toUpperCase();
        if (satellite.startsWith('N')) {
          viirsCount++;
        } else if (satellite === 'T') {
          terraCount++;
        } else {
          aquaCount++;
        }
      } else {
        // If satellite is undefined, count as other
        aquaCount++;
      }
    });

    return {
      totalPoints: firePoints.length,
      avgFrp: totalFrp / firePoints.length,
      maxFrp,
      dayCount,
      nightCount,
      highConfidence,
      mediumConfidence,
      lowConfidence,
      viirsCount,
      terraCount,
      aquaCount
    };
  }, [firePoints]);

  if (firePoints.length === 0) {
    return null;
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold mb-4">Statistics for {currentDate}</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div>
            <span className="font-semibold">Total Fire Points:</span>
            <span className="ml-2">{stats.totalPoints}</span>
          </div>
          <div>
            <span className="font-semibold">Average FRP:</span>
            <span className="ml-2">{stats.avgFrp.toFixed(2)} MW</span>
          </div>
          <div>
            <span className="font-semibold">Maximum FRP:</span>
            <span className="ml-2">{stats.maxFrp.toFixed(2)} MW</span>
          </div>
          <div>
            <span className="font-semibold">Day/Night Ratio:</span>
            <span className="ml-2">{stats.dayCount}/{stats.nightCount}</span>
          </div>
        </div>
        <div className="space-y-2">
          <div>
            <span className="font-semibold">Confidence Levels:</span>
            <div className="ml-2">
              <div>High: {stats.highConfidence}</div>
              <div>Medium: {stats.mediumConfidence}</div>
              <div>Low: {stats.lowConfidence}</div>
            </div>
          </div>
          <div>
            <span className="font-semibold">Satellite Distribution:</span>
            <div className="ml-2">
              <div>VIIRS: {stats.viirsCount}</div>
              <div>Terra: {stats.terraCount}</div>
              <div>Aqua: {stats.aquaCount}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FireStatsPanel; 