import React, { useMemo } from 'react';
import type { LatLngExpression } from 'leaflet';
import { CircleMarker, LayerGroup, Polygon, Polyline, Tooltip } from 'react-leaflet';
import { useMapStore } from '../../stores';
import { formatAreaSquareMeters, formatDistanceMeters } from './measurementUtils';

const MEASUREMENT_COLOR = '#f97316';

export const MeasurementOverlay: React.FC = () => {
  const measurement = useMapStore((state) => state.measurement);
  const hasPoints = measurement.points.length > 0;

  const summaryLines = useMemo(() => {
    const lines: string[] = [];
    if (measurement.lengthMeters > 0) {
      lines.push(`Distance: ${formatDistanceMeters(measurement.lengthMeters)}`);
    }
    if (measurement.areaSquareMeters > 0) {
      lines.push(`Area: ${formatAreaSquareMeters(measurement.areaSquareMeters)}`);
    }
    return lines;
  }, [measurement.lengthMeters, measurement.areaSquareMeters]);

  if (!hasPoints) {
    return null;
  }

  const positions = measurement.points as unknown as LatLngExpression[];
  const showPolygon = measurement.areaSquareMeters > 0;
  const dashArray = measurement.mode ? undefined : '6 6';

  return (
    <LayerGroup>
      <Polyline
        positions={positions}
        pathOptions={{ color: MEASUREMENT_COLOR, weight: 2, dashArray }}
      />
      {showPolygon ? (
        <Polygon
          positions={positions}
          pathOptions={{
            color: MEASUREMENT_COLOR,
            weight: 1,
            fillColor: MEASUREMENT_COLOR,
            fillOpacity: 0.2,
          }}
        />
      ) : null}
      {positions.map((position, index) => (
        <CircleMarker
          key={`measurement-point-${index}`}
          center={position}
          radius={4}
          pathOptions={{ color: MEASUREMENT_COLOR, fillColor: '#fff', fillOpacity: 1 }}
          interactive={false}
        >
          {index === positions.length - 1 && summaryLines.length ? (
            <Tooltip direction="top" offset={[0, -8]} opacity={1} permanent>
              <div className="measurement-tooltip">
                {summaryLines.map((line) => (
                  <div key={line}>{line}</div>
                ))}
              </div>
            </Tooltip>
          ) : null}
        </CircleMarker>
      ))}
    </LayerGroup>
  );
};
