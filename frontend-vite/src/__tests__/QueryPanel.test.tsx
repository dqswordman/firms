import { act, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { QueryPanel } from '../features/map/QueryPanel';
import { useMapStore } from '../stores';

describe('QueryPanel', () => {
  beforeEach(() => {
    act(() => {
      useMapStore.setState({
        queryParams: {
          mode: 'country',
          country: 'USA',
          startDate: '2024-01-01',
          endDate: '2024-01-03',
          format: 'geojson',
        },
        lastSubmittedQuery: {
          mode: 'country',
          country: 'USA',
          startDate: '2024-01-01',
          endDate: '2024-01-03',
          format: 'geojson',
        },
        filters: {
          frpMin: null,
          frpMax: null,
          confidence: 'all',
        },
      });
    });
  });

  it('renders defaults from the last query', () => {
    render(<QueryPanel />);
    expect(screen.getByLabelText(/ISO3/i)).toHaveValue('USA');
  });

  it('validates required country code', () => {
    render(<QueryPanel />);
    const input = screen.getByLabelText(/ISO3/i);
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.submit(screen.getByTestId('query-form'));
    expect(screen.getByText(/ISO3 country code/i)).toBeInTheDocument();
  });

  it('submits a valid country query', () => {
    render(<QueryPanel />);
    const input = screen.getByLabelText(/ISO3/i);
    fireEvent.change(input, { target: { value: 'MEX' } });
    fireEvent.click(screen.getByRole('button', { name: /run query/i }));

    const state = useMapStore.getState();
    expect(state.lastSubmittedQuery?.country).toBe('MEX');
    expect(state.queryParams?.country).toBe('MEX');
  });

  it('validates bbox coordinates', () => {
    render(<QueryPanel />);
    fireEvent.change(screen.getByLabelText(/mode/i), { target: { value: 'bbox' } });
    fireEvent.click(screen.getByRole('button', { name: /run query/i }));
    expect(screen.getByText(/enter all bounding box coordinates/i)).toBeInTheDocument();
  });
});
