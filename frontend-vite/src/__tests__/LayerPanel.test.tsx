import { act, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { LayerPanel } from '../features/map/LayerPanel';
import { useMapStore } from '../stores';

const resetStore = () => {
  act(() => {
    useMapStore.setState({
      showPoints: true,
      showClusters: true,
      showHeatmap: false,
    });
  });
};

describe('LayerPanel', () => {
  beforeEach(() => {
    resetStore();
  });

  it('renders toggles reflecting store state', () => {
    render(<LayerPanel />);

    const pointToggle = screen.getByLabelText(/fire points/i) as HTMLInputElement;
    const clusterToggle = screen.getByLabelText(/clustered hotspots/i) as HTMLInputElement;
    const heatmapToggle = screen.getByLabelText(/heatmap intensity/i) as HTMLInputElement;

    expect(pointToggle.checked).toBe(true);
    expect(clusterToggle.checked).toBe(true);
    expect(heatmapToggle.checked).toBe(false);
  });

  it('updates store when toggles change', () => {
    render(<LayerPanel />);

    const pointToggle = screen.getByLabelText(/fire points/i) as HTMLInputElement;
    const clusterToggle = screen.getByLabelText(/clustered hotspots/i) as HTMLInputElement;
    const heatmapToggle = screen.getByLabelText(/heatmap intensity/i) as HTMLInputElement;

    fireEvent.click(pointToggle);
    fireEvent.click(clusterToggle);
    fireEvent.click(heatmapToggle);

    const state = useMapStore.getState();
    expect(state.showPoints).toBe(false);
    expect(state.showClusters).toBe(false);
    expect(state.showHeatmap).toBe(true);
  });
});
