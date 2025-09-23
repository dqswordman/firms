import type { MeasurementState } from '../../stores/mapStore';

const KM_IN_METERS = 1000;
const SQ_M_IN_SQ_KM = 1_000_000;
const SQ_M_IN_HECTARE = 10_000;

export const formatDistanceMeters = (value: number): string => {
  if (value >= KM_IN_METERS) {
    return `${(value / KM_IN_METERS).toFixed(2)} km`;
  }
  if (value >= 1) {
    return `${value.toFixed(0)} m`;
  }
  return `${value.toFixed(2)} m`;
};

export const formatAreaSquareMeters = (value: number): string => {
  if (value >= SQ_M_IN_SQ_KM) {
    return `${(value / SQ_M_IN_SQ_KM).toFixed(2)} sq km`;
  }
  if (value >= SQ_M_IN_HECTARE) {
    return `${(value / SQ_M_IN_HECTARE).toFixed(2)} ha`;
  }
  return `${value.toFixed(0)} sq m`;
};

export const canCompleteMeasurement = (measurement: MeasurementState): boolean => {
  if (measurement.mode === 'distance') {
    return measurement.points.length >= 2;
  }
  if (measurement.mode === 'area') {
    return measurement.points.length >= 3;
  }
  return false;
};
