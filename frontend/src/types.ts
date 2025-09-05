import { Feature, FeatureCollection, Point } from 'geojson';

export interface FirePoint {
  latitude?: string; // Present in legacy JSON format
  longitude?: string; // Present in legacy JSON format
  bright_ti4?: string; // Raw brightness field (optional)
  bright_ti5?: string; // Raw brightness field (optional)
  brightness?: number; // Normalized brightness (GeoJSON properties)
  frp?: string | number;
  confidence?: string | number; // Accept numeric (0-100) or H/N/L strings
  acq_date?: string;
  acq_time?: string;
  satellite?: string;
  country_id?: string;
  daynight?: string;
  instrument?: string;
  scan?: string;
  track?: string;
  version?: string;
}

export type FireFeature = Feature<Point, FirePoint>;
export type FireFeatureCollection = FeatureCollection<Point, FirePoint>;

export interface SearchParams {
  mode: 'country' | 'bbox';
  country?: string;
  west?: number;
  south?: number;
  east?: number;
  north?: number;
  startDate: string;
  endDate: string;
  sourcePriority?: string; // Comma-separated priority list for backend
  format?: 'json' | 'geojson';
}
