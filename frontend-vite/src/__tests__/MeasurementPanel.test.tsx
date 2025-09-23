import { act, render, screen } from '@testing-library/react';
import React from 'react';
import { MeasurementPanel } from '../features/map/MeasurementPanel';
import { useMapStore } from '../stores';

const resetStore = () => {
  act(() => {
    useMapStore.setState({
      isInteractionEnabled: true,
      measurement: {
        mode: null,
        points: [],
        lengthMeters: 0,
        areaSquareMeters: 0,
      },
      showPoints: true,
      showClusters: true,
      showHeatmap: false,
      autoFitRequest: null,
    });
  });
};

describe('MeasurementPanel', () => {
  beforeEach(() => {
    resetStore();
  });

  it('enables start actions when idle', () => {
    render(<MeasurementPanel />);
    expect(screen.getByRole('button', { name: /distance/i })).toBeEnabled();
    expect(screen.getByRole('button', { name: /area/i })).toBeEnabled();
  });

  it('disables start actions during an active measurement and enables completion when enough points exist', () => {
    render(<MeasurementPanel />);

    act(() => {
      useMapStore.getState().startMeasurement('distance');
    });

    expect(screen.getByRole('button', { name: /distance/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /area/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /complete/i })).toBeDisabled();

    act(() => {
      useMapStore.getState().addMeasurementPoint([0, 0]);
      useMapStore.getState().addMeasurementPoint([0, 1]);
    });

    expect(screen.getByRole('button', { name: /complete/i })).toBeEnabled();
  });

  it('renders a summary after completing a measurement', () => {
    render(<MeasurementPanel />);

    act(() => {
      useMapStore.getState().startMeasurement('distance');
      useMapStore.getState().addMeasurementPoint([0, 0]);
      useMapStore.getState().addMeasurementPoint([0, 1]);
      useMapStore.getState().completeMeasurement();
    });

    expect(screen.getByTestId('measurement-distance-value').textContent).toContain('km');
  });
});
