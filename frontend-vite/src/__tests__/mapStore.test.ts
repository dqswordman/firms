import { act } from '@testing-library/react';
import { useMapStore } from '../stores';

const resetStore = () => {
  useMapStore.setState({
    viewport: { center: [37.8, -96.9], zoom: 4 },
    baseLayer: 'osm',
    showPoints: true,
    showClusters: true,
    showHeatmap: false,
    queryParams: {
      mode: 'country',
      country: 'USA',
      startDate: '2024-01-01',
      endDate: '2024-01-03',
      format: 'geojson',
    },
    isInteractionEnabled: true,
    filters: {
      frpMin: null,
      frpMax: null,
      confidence: 'all',
    },
    measurement: {
      mode: null,
      points: [],
      lengthMeters: 0,
      areaSquareMeters: 0,
    },
    autoFitRequest: null,
  });
};

describe('map store', () => {
  beforeEach(() => {
    resetStore();
  });

  it('updates viewport', () => {
    act(() => {
      useMapStore.getState().setViewport({ zoom: 5 });
    });
    expect(useMapStore.getState().viewport.zoom).toBe(5);
  });

  it('updates layer visibility toggles', () => {
    act(() => {
      useMapStore.getState().setShowPoints(false);
    });
    expect(useMapStore.getState().showPoints).toBe(false);

    act(() => {
      useMapStore.getState().setShowClusters(false);
    });
    expect(useMapStore.getState().showClusters).toBe(false);

    act(() => {
      useMapStore.getState().setShowHeatmap(true);
    });
    expect(useMapStore.getState().showHeatmap).toBe(true);
  });

  it('submits queries and tracks last submission', () => {
    const params = {
      mode: 'country',
      country: 'USA',
      startDate: '2024-02-01',
      endDate: '2024-02-03',
      format: 'geojson',
    } as const;

    act(() => {
      useMapStore.getState().submitQuery({ ...params });
    });

    const state = useMapStore.getState();
    expect(state.queryParams).toEqual(params);
    expect(state.lastSubmittedQuery).toEqual(params);
  });

  it('locks map interactions during measurement and restores afterwards', () => {
    act(() => {
      useMapStore.getState().startMeasurement('distance');
    });

    expect(useMapStore.getState().isInteractionEnabled).toBe(false);

    act(() => {
      useMapStore.getState().addMeasurementPoint([0, 0]);
      useMapStore.getState().addMeasurementPoint([0, 1]);
      useMapStore.getState().completeMeasurement();
    });

    const { isInteractionEnabled, measurement } = useMapStore.getState();
    expect(isInteractionEnabled).toBe(true);
    expect(measurement.mode).toBeNull();
    expect(measurement.lengthMeters).toBeGreaterThan(0);
  });

  it('cancels measurement and clears recorded points', () => {
    act(() => {
      useMapStore.getState().startMeasurement('area');
      useMapStore.getState().addMeasurementPoint([0, 0]);
      useMapStore.getState().addMeasurementPoint([0, 1]);
      useMapStore.getState().addMeasurementPoint([1, 1]);
      useMapStore.getState().cancelMeasurement();
    });

    const state = useMapStore.getState();
    expect(state.measurement.points).toEqual([]);
    expect(state.measurement.areaSquareMeters).toBe(0);
    expect(state.isInteractionEnabled).toBe(true);
  });

  it('records auto-fit requests with default padding', () => {
    act(() => {
      useMapStore.getState().requestAutoFit([[0, 0], [1, 1]]);
    });

    const request = useMapStore.getState().autoFitRequest;
    expect(request).not.toBeNull();
    expect(request?.padding).toEqual([24, 24]);
  });
});
