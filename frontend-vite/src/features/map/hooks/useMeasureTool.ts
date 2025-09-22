import { useEffect } from 'react';
import type { LeafletMouseEvent } from 'leaflet';
import { useMap } from 'react-leaflet';
import { useMapStore } from '../../../stores';
import type { LatLngTuple, MeasurementMode, MeasurementState } from '../../../stores/mapStore';

interface UseMeasureToolResult {
  measurement: MeasurementState;
  start: (mode: MeasurementMode) => void;
  addPoint: (position: LatLngTuple) => void;
  undo: () => void;
  complete: () => void;
  cancel: () => void;
}

const toTuple = (event: LeafletMouseEvent): LatLngTuple => [event.latlng.lat, event.latlng.lng];

export const useMeasureTool = (): UseMeasureToolResult => {
  const map = useMap();
  const measurement = useMapStore((state) => state.measurement);
  const startMeasurement = useMapStore((state) => state.startMeasurement);
  const addMeasurementPoint = useMapStore((state) => state.addMeasurementPoint);
  const undoMeasurementPoint = useMapStore((state) => state.undoMeasurementPoint);
  const completeMeasurement = useMapStore((state) => state.completeMeasurement);
  const cancelMeasurement = useMapStore((state) => state.cancelMeasurement);

  useEffect(() => {
    if (!map) {
      return;
    }

    const container = map.getContainer();
    if (measurement.mode) {
      container.classList.add('is-measuring');
    } else {
      container.classList.remove('is-measuring');
    }

    return () => {
      container.classList.remove('is-measuring');
    };
  }, [map, measurement.mode]);

  useEffect(() => {
    if (!map || !measurement.mode) {
      return;
    }

    const handleClick = (event: LeafletMouseEvent) => {
      addMeasurementPoint(toTuple(event));
    };

    const handleDoubleClick = (event: LeafletMouseEvent) => {
      event.originalEvent?.preventDefault?.();
      completeMeasurement();
    };

    const handleContextMenu = (event: LeafletMouseEvent) => {
      event.originalEvent?.preventDefault?.();
      undoMeasurementPoint();
    };

    map.on('click', handleClick);
    map.on('dblclick', handleDoubleClick);
    map.on('contextmenu', handleContextMenu);

    return () => {
      map.off('click', handleClick);
      map.off('dblclick', handleDoubleClick);
      map.off('contextmenu', handleContextMenu);
    };
  }, [map, measurement.mode, addMeasurementPoint, completeMeasurement, undoMeasurementPoint]);

  useEffect(() => {
    if (!measurement.mode) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        cancelMeasurement();
        return;
      }

      if ((event.key === 'Backspace' || event.key === 'Delete') && measurement.points.length) {
        event.preventDefault();
        undoMeasurementPoint();
        return;
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        completeMeasurement();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [measurement.mode, measurement.points.length, cancelMeasurement, undoMeasurementPoint, completeMeasurement]);

  return {
    measurement,
    start: startMeasurement,
    addPoint: addMeasurementPoint,
    undo: undoMeasurementPoint,
    complete: completeMeasurement,
    cancel: cancelMeasurement,
  };
};
