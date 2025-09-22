import { create } from 'zustand';
import { FiresQueryParams } from '../types';

export type BaseLayer = 'osm' | 'satellite';

export interface Viewport {
  center: [number, number];
  zoom: number;
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
}

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
}));
