export interface FiresQueryParams {
  mode: 'country' | 'bbox';
  country?: string;
  west?: number;
  south?: number;
  east?: number;
  north?: number;
  startDate: string;
  endDate: string;
  sourcePriority?: string;
  format?: 'json' | 'geojson';
}

export interface FirePointProperties {
  frp?: number | string;
  daynight?: string;
  confidence?: string | number;
  satellite?: string;
  acq_date?: string;
  acq_time?: string;
  [key: string]: unknown;
}

export interface FireFeature {
  type: 'Feature';
  geometry: { type: 'Point'; coordinates: [number, number] };
  properties: FirePointProperties;
}

export interface FireFeatureCollection {
  type: 'FeatureCollection';
  features: FireFeature[];
}
