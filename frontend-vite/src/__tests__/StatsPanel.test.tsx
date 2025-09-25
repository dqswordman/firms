import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import * as statsQueryModule from '../queries/fires';
import { StatsPanel } from '../features/map/StatsPanel';
import { useMapStore } from '../stores';

describe('StatsPanel', () => {
  beforeEach(() => {
    useMapStore.setState({
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

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders fallback when no query', () => {
    useMapStore.setState({ lastSubmittedQuery: null });
    vi.spyOn(statsQueryModule, 'useFiresQuery').mockReturnValue({ data: undefined } as any);
    vi.spyOn(statsQueryModule, 'useFireStatsQuery').mockReturnValue({
      data: undefined,
      isFetching: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof statsQueryModule.useFireStatsQuery>);
    render(<StatsPanel />);
    expect(screen.getByText(/Run a query/)).toBeInTheDocument();
  });

  it('renders loading state', () => {
    vi.spyOn(statsQueryModule, 'useFiresQuery').mockReturnValue({ data: undefined } as any);
    vi.spyOn(statsQueryModule, 'useFireStatsQuery').mockReturnValue({
      data: undefined,
      isFetching: true,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof statsQueryModule.useFireStatsQuery>);
    render(<StatsPanel />);
    expect(screen.getByText(/Loading analytics/)).toBeInTheDocument();
  });

  it('renders entries', () => {
    vi.spyOn(statsQueryModule, 'useFiresQuery').mockReturnValue({ data: undefined } as any);
    vi.spyOn(statsQueryModule, 'useFireStatsQuery').mockReturnValue({
      data: { total: 100, confidence: { high: 60 } },
      isFetching: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof statsQueryModule.useFireStatsQuery>);
    render(<StatsPanel />);
    expect(screen.getByText('total')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });
});
