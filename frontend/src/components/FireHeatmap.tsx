import React from 'react';
import { CircleMarker, Popup } from 'react-leaflet';
import { FirePoint } from '../types';

interface FireHeatmapProps {
  firePoints: FirePoint[];
}

const FireHeatmap: React.FC<FireHeatmapProps> = ({ firePoints }) => {

  console.log('FireHeatmap received firePoints:', firePoints);

  const getColorForIntensity = (intensity: number): string => {
    if (intensity < 300) return '#0000FF'; // Blue
    if (intensity < 320) return '#00FF00'; // Green
    if (intensity < 340) return '#FFFF00'; // Yellow
    if (intensity < 360) return '#FFA500'; // Orange
    return '#FF0000'; // Red
  };

  return (
    <>
      {firePoints.map((point, index) => {
         console.log('Rendering point:', point);
         // Basic validation for coordinates
         const lat = parseFloat(point.latitude);
         const lng = parseFloat(point.longitude);

         if (isNaN(lat) || isNaN(lng)) {
            console.error('Invalid coordinates for point:', point);
            return null; // Don't render point with invalid coordinates
         }

        return (
        <CircleMarker
          key={`${point.acq_date}-${point.acq_time}-${index}`}
          center={[lat, lng]}
          radius={5}
          pathOptions={{
            fillColor: getColorForIntensity(parseFloat(point.bright_ti4)),
            fillOpacity: 0.7,
            color: 'transparent'
          }}
        >
          <Popup>
            <div>
              <p>亮度 (TI4): {parseFloat(point.bright_ti4).toFixed(2)}</p>
              <p>亮度 (TI5): {parseFloat(point.bright_ti5).toFixed(2)}</p>
              <p>日期: {point.acq_date}</p>
              <p>时间: {point.acq_time}</p>
              <p>卫星: {point.satellite}</p>
              <p>置信度: {point.confidence}</p>
              <p>辐射功率: {parseFloat(point.frp).toFixed(2)}</p>
              <p>国家: {point.country_id}</p>
              <p>昼夜: {point.daynight === 'D' ? '白天' : '夜间'}</p>
              <p>仪器: {point.instrument}</p>
              <p>扫描: {point.scan}</p>
              <p>轨道: {point.track}</p>
              <p>版本: {point.version}</p>
            </div>
          </Popup>
        </CircleMarker>
      );})}
    </>
  );
};

export default FireHeatmap;