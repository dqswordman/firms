import { act } from '@testing-library/react';
import { useMapStore } from '../stores';

describe('map store', () => {
  it('updates viewport', () => {
    act(() => {
      useMapStore.getState().setViewport({ zoom: 5 });
    });
    expect(useMapStore.getState().viewport.zoom).toBe(5);
  });
});
