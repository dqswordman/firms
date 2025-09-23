import { act, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { FilterPanel } from '../features/map/FilterPanel';
import { useMapStore } from '../stores';

describe('FilterPanel', () => {
  beforeEach(() => {
    act(() => {
      useMapStore.setState({
        filters: {
          frpMin: null,
          frpMax: null,
          confidence: 'all',
        },
      });
    });
  });

  it('updates FRP range', () => {
    render(<FilterPanel />);
    fireEvent.change(screen.getByLabelText(/FRP min/i), { target: { value: '50' } });
    fireEvent.blur(screen.getByLabelText(/FRP min/i));
    const state = useMapStore.getState();
    expect(state.filters.frpMin).toBe(50);
  });

  it('updates confidence', () => {
    render(<FilterPanel />);
    fireEvent.change(screen.getByLabelText(/Confidence/i), { target: { value: 'high' } });
    expect(useMapStore.getState().filters.confidence).toBe('high');
  });
});
