import React from 'react';
import { CircleMarker, Popup } from 'react-leaflet';
import { FirePoint } from '../types';

interface FireHeatmapProps {
  firePoints: FirePoint[];
}

const FireHeatmap: React.FC<FireHeatmapProps> = ({ firePoints }) => {

  console.log('FireHeatmap received firePoints:', firePoints);

  const getColorForIntensity = (intensity: number): string => {
    if (intensity < 300) return '#0000FF'; // Blue - Low intensity
    if (intensity < 320) return '#00FF00'; // Green - Medium-Low intensity
    if (intensity < 340) return '#FFFF00'; // Yellow - Medium intensity
    if (intensity < 360) return '#FFA500'; // Orange - Medium-High intensity
    return '#FF0000'; // Red - High intensity
  };

  const getIntensityLabel = (intensity: number): string => {
    if (intensity < 300) return 'Low';
    if (intensity < 320) return 'Medium-Low';
    if (intensity < 340) return 'Medium';
    if (intensity < 360) return 'Medium-High';
    return 'High';
  };

  return (
    <>
      {firePoints.map((point, index) => {
         console.log('Rendering point:', point);
         // Basic validation for coordinates
         const lat = parseFloat(point.latitude);
         const lng = parseFloat(point.longitude);
         const intensity = parseFloat(point.bright_ti4);
         const intensityLabel = getIntensityLabel(intensity);

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
            fillColor: getColorForIntensity(intensity),
            fillOpacity: 0.7,
            color: 'transparent'
          }}
        >
          <Popup>
            <div className="text-sm">
              <h3 className="font-bold mb-2">Fire Point Details</h3>
              <p><span className="font-semibold">Intensity:</span> {intensityLabel} ({intensity.toFixed(2)}K)</p>
              <p><span className="font-semibold">Brightness (TI5):</span> {parseFloat(point.bright_ti5).toFixed(2)}K</p>
              <p><span className="font-semibold">Date:</span> {point.acq_date}</p>
              <p><span className="font-semibold">Time:</span> {point.acq_time}</p>
              <p><span className="font-semibold">Satellite:</span> {point.satellite}</p>
              <p><span className="font-semibold">Confidence:</span> {point.confidence}</p>
              <p><span className="font-semibold">Radiative Power:</span> {parseFloat(point.frp).toFixed(2)} MW</p>
              <p><span className="font-semibold">Country:</span> {point.country_id}</p>
              <p><span className="font-semibold">Day/Night:</span> {point.daynight === 'D' ? 'Day' : 'Night'}</p>
              <p><span className="font-semibold">Instrument:</span> {point.instrument}</p>
              <p><span className="font-semibold">Scan:</span> {point.scan}</p>
              <p><span className="font-semibold">Track:</span> {point.track}</p>
              <p><span className="font-semibold">Version:</span> {point.version}</p>
            </div>
          </Popup>
        </CircleMarker>
      );})}
    </>
  );
};

export default FireHeatmap;