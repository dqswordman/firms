import { create } from 'zustand';
import type { LatLngBoundsExpression } from 'leaflet';
import { FiresQueryParams } from '../types';

export type BaseLayer = 'osm' | 'satellite';
export type LatLngTuple = [number, number];
export type MeasurementMode = 'distance' | 'area';

export interface Viewport {
  center: LatLngTuple;
  zoom: number;
}

export interface AutoFitRequest {
  bounds: LatLngBoundsExpression;
  padding: [number, number];
}

export interface MeasurementState {
  mode: MeasurementMode | null;
  points: LatLngTuple[];
  lengthMeters: number;
  areaSquareMeters: number;
}

interface MapStore {
  viewport: Viewport;
  setViewport: (update: Partial<Viewport>) => void;
  baseLayer: BaseLayer;
  setBaseLayer: (layer: BaseLayer) => void;
  showHeatmap: boolean;
  toggleHeatmap: () => void;
  queryParams: FiresQueryParams | null;
  setQueryParams: (params: FiresQueryParams) => void;
  isInteractionEnabled: boolean;
  setInteractionEnabled: (enabled: boolean) => void;
  measurement: MeasurementState;
  startMeasurement: (mode: MeasurementMode) => void;
  addMeasurementPoint: (point: LatLngTuple) => void;
  undoMeasurementPoint: () => void;
  completeMeasurement: () => void;
  cancelMeasurement: () => void;
  autoFitRequest: AutoFitRequest | null;
  requestAutoFit: (bounds: LatLngBoundsExpression, padding?: [number, number]) => void;
  clearAutoFit: () => void;
}

const EARTH_RADIUS_METERS = 6_371_000;

const toRadians = (value: number): number => (value * Math.PI) / 180;

const haversineDistance = (a: LatLngTuple, b: LatLngTuple): number => {
  const lat1 = toRadians(a[0]);
  const lat2 = toRadians(b[0]);
  const dLat = lat2 - lat1;
  const dLng = toRadians(b[1] - a[1]);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(h)));
};

const computeLengthMeters = (points: LatLngTuple[]): number => {
  if (points.length < 2) {
    return 0;
  }

  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    total += haversineDistance(points[i - 1], points[i]);
  }

  return total;
};

const computeAreaSquareMeters = (points: LatLngTuple[]): number => {
  if (points.length < 3) {
    return 0;
  }

  const latAvgRad = toRadians(points.reduce((sum, [lat]) => sum + lat, 0) / points.length);
  const projected = points.map(([lat, lng]) => {
    const x = EARTH_RADIUS_METERS * toRadians(lng) * Math.cos(latAvgRad);
    const y = EARTH_RADIUS_METERS * toRadians(lat);
    return [x, y] as [number, number];
  });

  let area = 0;
  for (let i = 0; i < projected.length; i += 1) {
    const [x1, y1] = projected[i];
    const [x2, y2] = projected[(i + 1) % projected.length];
    area += x1 * y2 - x2 * y1;
  }

  return Math.abs(area) / 2;
};

const createDefaultMeasurement = (): MeasurementState => ({
  mode: null,
  points: [],
  lengthMeters: 0,
  areaSquareMeters: 0,
});

const defaultQuery: FiresQueryParams = {
  mode: 'country',
  country: 'USA',
  startDate: '2024-01-01',
  endDate: '2024-01-03',
  format: 'geojson',
};

export const useMapStore = create<MapStore>((set) => ({
  viewport: {
    center: [37.8, -96.9],
    zoom: 4,
  },
  setViewport: (update) =>
    set((state) => ({
      viewport: {
        center: update.center ?? state.viewport.center,
        zoom: update.zoom ?? state.viewport.zoom,
      },
    })),
  baseLayer: 'osm',
  setBaseLayer: (layer) => set({ baseLayer: layer }),
  showHeatmap: true,
  toggleHeatmap: () => set((state) => ({ showHeatmap: !state.showHeatmap })),
  queryParams: defaultQuery,
  setQueryParams: (params) => set({ queryParams: params }),
  isInteractionEnabled: true,
  setInteractionEnabled: (enabled) => set({ isInteractionEnabled: enabled }),
  measurement: createDefaultMeasurement(),
  startMeasurement: (mode) =>
    set(() => ({
      measurement: {
        mode,
        points: [],
        lengthMeters: 0,
        areaSquareMeters: 0,
      },
      isInteractionEnabled: false,
    })),
  addMeasurementPoint: (point) =>
    set((state) => {
      if (!state.measurement.mode) {
        return {};
      }

      const points = [...state.measurement.points, point];
      return {
        measurement: {
          ...state.measurement,
          points,
          lengthMeters: computeLengthMeters(points),
          areaSquareMeters: computeAreaSquareMeters(points),
        },
      };
    }),
  undoMeasurementPoint: () =>
    set((state) => {
      if (!state.measurement.points.length) {
        return {};
      }

      const points = state.measurement.points.slice(0, -1);
      return {
        measurement: {
          ...state.measurement,
          points,
          lengthMeters: computeLengthMeters(points),
          areaSquareMeters: computeAreaSquareMeters(points),
        },
      };
    }),
  completeMeasurement: () =>
    set((state) => {
      if (!state.measurement.mode) {
        return {};
      }

      return {
        measurement: {
          ...state.measurement,
          mode: null,
        },
        isInteractionEnabled: true,
      };
    }),
  cancelMeasurement: () =>
    set(() => ({
      measurement: createDefaultMeasurement(),
      isInteractionEnabled: true,
    })),
  autoFitRequest: null,
  requestAutoFit: (bounds, padding) =>
    set({
      autoFitRequest: {
        bounds,
        padding: padding ?? [24, 24],
      },
    }),
  clearAutoFit: () => set({ autoFitRequest: null }),
}));
