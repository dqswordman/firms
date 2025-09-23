import React, { useMemo } from 'react';
import { useMapStore } from '../../stores';
import { canCompleteMeasurement, formatAreaSquareMeters, formatDistanceMeters } from './measurementUtils';

export const MeasurementPanel: React.FC = () => {
  const measurement = useMapStore((state) => state.measurement);
  const startMeasurement = useMapStore((state) => state.startMeasurement);
  const undoMeasurementPoint = useMapStore((state) => state.undoMeasurementPoint);
  const completeMeasurement = useMapStore((state) => state.completeMeasurement);
  const cancelMeasurement = useMapStore((state) => state.cancelMeasurement);

  const isActive = measurement.mode !== null;
  const hasPoints = measurement.points.length > 0;
  const canComplete = canCompleteMeasurement(measurement);
  const canUndo = isActive && hasPoints;

  const summary = useMemo(() => ({
    distance: measurement.lengthMeters > 0 ? formatDistanceMeters(measurement.lengthMeters) : null,
    area: measurement.areaSquareMeters > 0 ? formatAreaSquareMeters(measurement.areaSquareMeters) : null,
  }), [measurement.lengthMeters, measurement.areaSquareMeters]);

  const instructions = isActive
    ? 'Left click to add points. Double click to finish, right click (or Delete) to undo, and press Esc to cancel.'
    : hasPoints
      ? 'Measurement complete. Start another capture or clear the existing result.'
      : 'Start a distance or area measurement to drop points on the map.';

  return (
    <section className="measurement-card">
      <header>
        <h2>Measurement</h2>
        <p>{instructions}</p>
      </header>
      <div className="measurement-controls">
        <button type="button" onClick={() => startMeasurement('distance')} disabled={isActive}>
          Distance
        </button>
        <button type="button" onClick={() => startMeasurement('area')} disabled={isActive}>
          Area
        </button>
      </div>
      {isActive ? (
        <div className="measurement-controls measurement-controls--secondary">
          <button type="button" onClick={undoMeasurementPoint} disabled={!canUndo}>
            Undo
          </button>
          <button type="button" onClick={completeMeasurement} disabled={!canComplete}>
            Complete
          </button>
          <button type="button" onClick={cancelMeasurement}>
            Cancel
          </button>
        </div>
      ) : (
        <div className="measurement-controls measurement-controls--secondary">
          <button type="button" onClick={cancelMeasurement} disabled={!hasPoints}>
            Clear measurement
          </button>
        </div>
      )}
      {(summary.distance || summary.area) ? (
        <dl className="measurement-summary">
          {summary.distance ? (
            <div>
              <dt>Distance</dt>
              <dd data-testid="measurement-distance-value">{summary.distance}</dd>
            </div>
          ) : null}
          {summary.area ? (
            <div>
              <dt>Area</dt>
              <dd data-testid="measurement-area-value">{summary.area}</dd>
            </div>
          ) : null}
        </dl>
      ) : null}
    </section>
  );
};
