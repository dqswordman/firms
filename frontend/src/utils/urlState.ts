export type BaseLayerType = 'osm' | 'esri' | 'carto-dark' | 'stamen-toner' | 'topo' | 'blue-marble';

export type LayerSettings = {
  showHeatmap?: boolean;
  showCluster?: boolean;
  showStats?: boolean;
  showTrends?: boolean;
  showRadar?: boolean;
  baseLayer?: BaseLayerType;
  showGraticule?: boolean;
  showCountryOutline?: boolean;
  showStreetsRef?: boolean;
  weightBy?: 'frp' | 'brightness';
  threshold?: number;
  // Map-only filter state
  filterEnabled?: boolean;
  filterBy?: 'frp' | 'brightness';
  filterThreshold?: number;
  filterAffectsAnalytics?: boolean;
};

export type Viewport = { lat?: number; lng?: number; zoom?: number };

export type EncodedState = {
  mode?: 'country' | 'bbox';
  country?: string;
  west?: number; south?: number; east?: number; north?: number;
  start?: string; end?: string; current?: string;
  layers?: LayerSettings;
  vp?: Viewport;
};

export function encodeState(state: EncodedState): string {
  const payload: any = {};
  if (state.mode) payload.m = state.mode;
  if (state.country) payload.c = state.country;
  if (state.west !== undefined) payload.w = state.west;
  if (state.south !== undefined) payload.s = state.south;
  if (state.east !== undefined) payload.e = state.east;
  if (state.north !== undefined) payload.n = state.north;
  if (state.start) payload.sd = state.start;
  if (state.end) payload.ed = state.end;
  if (state.current) payload.cd = state.current;
  if (state.layers) payload.l = state.layers;
  if (state.vp) payload.vp = state.vp;
  try {
    return '#state=' + encodeURIComponent(JSON.stringify(payload));
  } catch (e) {
    return '';
  }
}

export function decodeState(hash: string): EncodedState | null {
  if (!hash) return null;
  const idx = hash.indexOf('#state=');
  if (idx === -1) return null;
  try {
    const json = decodeURIComponent(hash.substring(idx + 7));
    const obj = JSON.parse(json);
    const st: EncodedState = {
      mode: obj.m,
      country: obj.c,
      west: obj.w, south: obj.s, east: obj.e, north: obj.n,
      start: obj.sd, end: obj.ed, current: obj.cd,
      layers: obj.l,
      vp: obj.vp,
    };
    return st;
  } catch {
    return null;
  }
}
