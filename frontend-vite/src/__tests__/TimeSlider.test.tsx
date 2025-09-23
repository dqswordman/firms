import { act, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { TimeSlider } from '../features/map/TimeSlider';
import { useMapStore } from '../stores';

describe('TimeSlider', () => {
  beforeEach(() => {
    act(() => {
      useMapStore.setState({
        lastSubmittedQuery: {
          mode: 'country',
          country: 'USA',
          startDate: '2024-01-01',
          endDate: '2024-01-03',
          format: 'geojson',
        },
        queryParams: {
          mode: 'country',
          country: 'USA',
          startDate: '2024-01-01',
          endDate: '2024-01-03',
          format: 'geojson',
        },
      });
    });
  });

  it('renders current span summary', () => {
    render(<TimeSlider />);
    expect(screen.getByText(/2 day/)).toBeInTheDocument();
  });

  it('submits updated range when slider changes', () => {
    render(<TimeSlider />);
    const slider = screen.getByLabelText(/Range/i) as HTMLInputElement;
    fireEvent.change(slider, { target: { value: '5' } });
    const state = useMapStore.getState();
    expect(state.lastSubmittedQuery?.startDate).toBe('2023-12-30');
    expect(state.queryParams?.startDate).toBe('2023-12-30');
  });
});
