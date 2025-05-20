export interface FirePoint {
  latitude: string;
  longitude: string;
  bright_ti4: string;
  bright_ti5: string;
  frp: string;
  confidence: string;
  acq_date: string;
  acq_time: string;
  satellite: string;
  country_id: string;
  daynight: string;
  instrument: string;
  scan: string;
  track: string;
  version: string;
}

export interface SearchParams {
  mode: 'country' | 'bbox';
  country?: string;
  west?: number;
  south?: number;
  east?: number;
  north?: number;
  startDate: string;
  endDate: string;
} 