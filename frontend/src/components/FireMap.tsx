import React, { useState, useMemo } from 'react';
import { MapContainer, TileLayer, ScaleControl, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import FireHeatmap from './FireHeatmap';
import FireCluster from './FireCluster';
import FireStatsPanel from './FireStatsPanel';
import FireTrendChart from './FireTrendChart';
import FireRadarChart from './FireRadarChart';
import SearchForm from './SearchForm';
import TimeSlider from './TimeSlider';
import { FireFeatureCollection, FirePoint, SearchParams } from '../types';
import { LayerSettings } from '../utils/urlState';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Paper,
  Slider as MUISlider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  Stack,
  Divider,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
} from '@mui/material';

interface FireMapProps {
  fireCollection: FireFeatureCollection;
  fullCollection: FireFeatureCollection;
  onSearch: (params: any) => void;
  dates: string[];
  currentDate: string;
  onDateChange: (date: string) => void;
  searchParams: SearchParams | null;
  initialSettings?: Partial<LayerSettings>;
  onSettingsChange?: (s: any) => void;
  onViewportChange?: (vp: { lat: number; lng: number; zoom: number }) => void;
  onQuickRange?: (token: 'today' | '24h' | '48h' | '7d' | 'week') => void;
}

const FireMap: React.FC<FireMapProps> = ({ fireCollection, fullCollection, onSearch, dates, currentDate, onDateChange, searchParams, initialSettings, onSettingsChange, onViewportChange, onQuickRange }) => {
  const firePoints = useMemo(() => (fireCollection?.features ?? []).map(f => f.properties as FirePoint), [fireCollection]);
  const firePointsAll = useMemo(() => (fullCollection?.features ?? []).map(f => f.properties as FirePoint), [fullCollection]);
  const [showHeatmap, setShowHeatmap] = useState(initialSettings?.showHeatmap ?? true);
  const [showCluster, setShowCluster] = useState(initialSettings?.showCluster ?? true);
  const [showStats, setShowStats] = useState(initialSettings?.showStats ?? false);
  const [showTrends, setShowTrends] = useState(initialSettings?.showTrends ?? false);
  const [showRadar, setShowRadar] = useState(initialSettings?.showRadar ?? false);
  const [baseLayer, setBaseLayer] = useState<'osm' | 'esri' | 'carto-dark' | 'stamen-toner' | 'topo' | 'blue-marble'>(initialSettings?.baseLayer as any ?? 'osm');
  const [activeTab, setActiveTab] = useState<'stats' | 'trend' | 'radar'>('stats');
  const [weightBy, setWeightBy] = useState<'frp' | 'brightness'>(initialSettings?.weightBy ?? 'frp');
  const [threshold, setThreshold] = useState(initialSettings?.threshold ?? 0);
  const [filterEnabled, setFilterEnabled] = useState(initialSettings?.filterEnabled ?? false);
  const [filterBy, setFilterBy] = useState<'frp' | 'brightness'>(initialSettings?.filterBy ?? 'frp');
  const [filterThreshold, setFilterThreshold] = useState<number>(initialSettings?.filterThreshold ?? 0);
  const [filterAffectsAnalytics, setFilterAffectsAnalytics] = useState<boolean>(initialSettings?.filterAffectsAnalytics ?? false);
  const [showGraticule, setShowGraticule] = useState(initialSettings?.showGraticule ?? false);
  const [showCountryOutline, setShowCountryOutline] = useState(initialSettings?.showCountryOutline ?? false);
  const [showStreetsRef, setShowStreetsRef] = useState(initialSettings?.showStreetsRef ?? false);
  const [rangeDates, setRangeDates] = useState<{ start?: string; end?: string }>({});
  const [helpOpen, setHelpOpen] = useState(false);
  const [measureMode, setMeasureMode] = useState(false);
  const [measureType, setMeasureType] = useState<'distance' | 'area'>('distance');
  const [distanceUnit, setDistanceUnit] = useState<'km' | 'mi' | 'm'>('km');
  const [areaUnit, setAreaUnit] = useState<'km2' | 'mi2' | 'ha'>('km2');
  const [panMode, setPanMode] = useState(false);
  const [measureClearToken, setMeasureClearToken] = useState(0);
  const controlsRef = React.useRef<HTMLDivElement | null>(null);
  const [highlightLayers, setHighlightLayers] = useState(false);
  const maxWeight = useMemo(() => {
    const values = firePoints.map(p => {
      if (weightBy === 'frp') {
        const raw = p.frp as any;
        return typeof raw === 'number' ? raw : parseFloat(raw || '0');
      }
      const b = (p as any).brightness as any;
      if (typeof b === 'number') return b;
      return parseFloat(p.bright_ti4 || '0');
    }).filter(v => !isNaN(v));
    return values.length > 0 ? Math.max(...values) : 0;
  }, [firePoints, weightBy]);

  // Apply optional filter to displayed features (map only)
  const displayCollection: FireFeatureCollection = useMemo(() => {
    if (!filterEnabled) return fireCollection;
    const features = fireCollection.features.filter(f => {
      const props: any = f.properties;
      if (filterBy === 'frp') {
        const raw = props.frp;
        const val = typeof raw === 'number' ? raw : parseFloat(raw || '0');
        return !isNaN(val) && val >= filterThreshold;
      } else {
        const b = props.brightness as any;
        const val = typeof b === 'number' ? b : parseFloat(props.bright_ti4 || '0');
        return !isNaN(val) && val >= filterThreshold;
      }
    });
    return { type: 'FeatureCollection', features } as FireFeatureCollection;
  }, [fireCollection, filterEnabled, filterBy, filterThreshold]);

  // propagate settings to parent (guarded against callback identity churn)
  const prevSettingsJsonRef = React.useRef<string>("{}");
  React.useEffect(() => {
    const settings = {
      showHeatmap,
      showCluster,
      showStats,
      showTrends,
      showRadar,
      baseLayer,
      showGraticule,
      showCountryOutline,
      showStreetsRef,
      weightBy,
      threshold,
      filterEnabled,
      filterBy,
      filterThreshold,
      filterAffectsAnalytics,
    };
    const json = JSON.stringify(settings);
    if (json !== prevSettingsJsonRef.current) {
      prevSettingsJsonRef.current = json;
      onSettingsChange?.(settings);
    }
  }, [showHeatmap, showCluster, showStats, showTrends, showRadar, baseLayer, showGraticule, showCountryOutline, showStreetsRef, weightBy, threshold, filterEnabled, filterBy, filterThreshold, filterAffectsAnalytics]);

  // Analytics data (optionally filtered by the same criteria)
  const analyticsDayPoints: FirePoint[] = useMemo(() => {
    if (!filterEnabled || !filterAffectsAnalytics) return firePoints;
    return firePoints.filter((p: any) => {
      if (filterBy === 'frp') {
        const raw = p.frp;
        const val = typeof raw === 'number' ? raw : parseFloat(raw || '0');
        return !isNaN(val) && val >= filterThreshold;
      } else {
        const b: any = p.brightness;
        const val = typeof b === 'number' ? b : parseFloat(p.bright_ti4 || '0');
        return !isNaN(val) && val >= filterThreshold;
      }
    });
  }, [firePoints, filterEnabled, filterAffectsAnalytics, filterBy, filterThreshold]);

  const analyticsAllPoints: FirePoint[] = useMemo(() => {
    if (!filterEnabled || !filterAffectsAnalytics) return firePointsAll;
    return firePointsAll.filter((p: any) => {
      if (filterBy === 'frp') {
        const raw = p.frp;
        const val = typeof raw === 'number' ? raw : parseFloat(raw || '0');
        return !isNaN(val) && val >= filterThreshold;
      } else {
        const b: any = p.brightness;
        const val = typeof b === 'number' ? b : parseFloat(p.bright_ti4 || '0');
        return !isNaN(val) && val >= filterThreshold;
      }
    });
  }, [firePointsAll, filterEnabled, filterAffectsAnalytics, filterBy, filterThreshold]);

  const renderVisualizationControls = () => (
    <Box sx={{ position: 'absolute', top: 16, right: 16, zIndex: 1200, pointerEvents: 'auto' }}>
      <Paper elevation={6} sx={{ p: 1, minWidth: 360, maxHeight: '85vh', overflowY: 'auto', outline: highlightLayers ? '2px solid #f59e0b' : 'none', outlineOffset: '2px', transition: 'outline-color 0.3s' }} ref={controlsRef} tabIndex={-1}>
        {/* Fires (Heatmap/Clusters) */}
        <Accordion defaultExpanded>
          <AccordionSummary>
            <Typography variant="subtitle2">Fires</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <FormControlLabel control={<Switch checked={showHeatmap} onChange={(e) => setShowHeatmap(e.target.checked)} />} label="Heatmap" />
            {showHeatmap && (
              <Box sx={{ pl: 3, pb: 1 }}>
                <FormControl size="small" fullWidth>
                  <InputLabel id="weight-by-label">Weight by</InputLabel>
                  <Select
                    labelId="weight-by-label"
                    label="Weight by"
                    value={weightBy}
                    onChange={(e) => setWeightBy(e.target.value as 'frp' | 'brightness')}
                    MenuProps={{
                      PaperProps: { sx: { zIndex: 20000 } },
                      slotProps: { paper: { sx: { zIndex: 20000 } } },
                      disablePortal: false,
                      container: document.body,
                    }}
                  >
                    <MenuItem value="frp">FRP</MenuItem>
                    <MenuItem value="brightness">Brightness</MenuItem>
                  </Select>
                </FormControl>
                <Typography variant="caption" color="text.secondary">Threshold: {threshold.toFixed(0)}</Typography>
                <MUISlider size="small" min={0} max={Math.max(maxWeight, 1)} value={threshold} onChange={(_, v) => setThreshold(v as number)} />
              </Box>
            )}
            <FormControlLabel control={<Switch checked={showCluster} onChange={(e) => setShowCluster(e.target.checked)} />} label="Clusters" />

            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Filter</Typography>
            <FormControlLabel control={<Switch checked={filterEnabled} onChange={(e) => setFilterEnabled(e.target.checked)} />} label="Enable Filter" />
            {filterEnabled && (
              <Box sx={{ pl: 3 }}>
                <FormControl size="small" fullWidth sx={{ mb: 1 }}>
                  <InputLabel id="filter-by-label">Filter by</InputLabel>
                  <Select
                    labelId="filter-by-label"
                    label="Filter by"
                    value={filterBy}
                    onChange={(e) => setFilterBy(e.target.value as 'frp' | 'brightness')}
                    MenuProps={{
                      PaperProps: { sx: { zIndex: 20000 } },
                      slotProps: { paper: { sx: { zIndex: 20000 } } },
                      disablePortal: false,
                      container: document.body,
                    }}
                  >
                    <MenuItem value="frp">FRP</MenuItem>
                    <MenuItem value="brightness">Brightness</MenuItem>
                  </Select>
                </FormControl>
                <Typography variant="caption" color="text.secondary">Min {filterBy.toUpperCase()}: {filterThreshold.toFixed(0)}</Typography>
                <MUISlider size="small" min={0} max={Math.max(maxWeight, 1)} value={filterThreshold} onChange={(_, v) => setFilterThreshold(v as number)} />
                <FormControlLabel sx={{ mt: 0.5 }} control={<Switch checked={filterAffectsAnalytics} onChange={(e) => setFilterAffectsAnalytics(e.target.checked)} />} label="Apply to Analytics" />
              </Box>
            )}
          </AccordionDetails>
        </Accordion>

        {/* Overlays */}
        <Accordion>
          <AccordionSummary>
            <Typography variant="subtitle2">Overlays</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <FormControlLabel control={<Switch checked={showCountryOutline} onChange={(e) => setShowCountryOutline(e.target.checked)} />} label="Country Outline" />
            <FormControlLabel control={<Switch checked={showGraticule} onChange={(e) => setShowGraticule(e.target.checked)} />} label="Graticule" />
            <FormControlLabel control={<Switch checked={showStreetsRef} onChange={(e) => setShowStreetsRef(e.target.checked)} />} label="Street Ref" />
          </AccordionDetails>
        </Accordion>

        {/* Backgrounds (Basemap) */}
        <Accordion>
          <AccordionSummary>
            <Typography variant="subtitle2">Backgrounds</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <FormControl size="small" fullWidth>
              <InputLabel id="basemap-label">Basemap</InputLabel>
              <Select
                labelId="basemap-label"
                label="Basemap"
                value={baseLayer}
                onChange={(e) => setBaseLayer(e.target.value as any)}
                MenuProps={{
                  PaperProps: { sx: { zIndex: 10000 } },
                  slotProps: { paper: { sx: { zIndex: 10000 } } },
                  disablePortal: false,
                  container: document.body,
                }}
              >
                <MenuItem value="osm">OSM Standard</MenuItem>
                <MenuItem value="carto-dark">CARTO Dark</MenuItem>
                <MenuItem value="esri">Esri Satellite</MenuItem>
                <MenuItem value="stamen-toner">Stamen Toner</MenuItem>
                <MenuItem value="topo">OpenTopoMap</MenuItem>
                <MenuItem value="blue-marble">Blue Marble (GIBS)</MenuItem>
              </Select>
            </FormControl>
          </AccordionDetails>
        </Accordion>

        {/* Analytics (Statistics / Trend / Radar) */}
        {firePoints.length > 0 && dates.length > 0 && searchParams && (
          <Accordion>
            <AccordionSummary>
              <Typography variant="subtitle2">Analytics</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Tabs
                value={activeTab}
                onChange={(_, v) => setActiveTab(v)}
                textColor="secondary"
                indicatorColor="secondary"
                variant="fullWidth"
              >
                <Tab label="Statistics" value="stats" />
                <Tab label="Trend" value="trend" />
                <Tab label="Radar" value="radar" />
              </Tabs>
              <Box sx={{ mt: 2, height: 280 }}>
                {activeTab === 'stats' && (
                  <FireStatsPanel firePoints={analyticsDayPoints} currentDate={currentDate} />
                )}
                {activeTab === 'trend' && (
                  <Box sx={{ height: '100%' }}>
                    <FireTrendChart
                      firePoints={analyticsDayPoints}
                      startDate={new Date(dates[0])}
                      endDate={new Date(dates[dates.length - 1])}
                      viewStartDate={rangeDates.start ? new Date(rangeDates.start) : undefined}
                      viewEndDate={rangeDates.end ? new Date(rangeDates.end) : undefined}
                      params={searchParams as any}
                      allPoints={analyticsAllPoints}
                    />
                  </Box>
                )}
                {activeTab === 'radar' && (
                  <FireRadarChart firePoints={analyticsDayPoints} />
                )}
              </Box>
            </AccordionDetails>
          </Accordion>
        )}
        {/* Legend removed to avoid dropdown overlap */}
</Paper>
    </Box>
  );

  const MouseCoords: React.FC = () => {
    const [ll, setLl] = useState<[number, number] | null>(null);
    useMapEvents({
      mousemove(e) { setLl([e.latlng.lat, e.latlng.lng]); },
      mouseout() { setLl(null); }
    });
    if (!ll) return null;
    return (
      <Box sx={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', bgcolor: 'rgba(15,18,36,0.75)', color: '#cbd5e1', px: 1.5, py: 0.5, borderRadius: 1, fontSize: 12, zIndex: 1200 }}>
        Lat: {ll[0].toFixed(3)}闂? Lon: {ll[1].toFixed(3)}闂?      </Box>
    );
  };

  // Fixed coordinates overlay with degree symbol rendering
  const MouseCoordsFixed: React.FC = () => {
    const [ll, setLl] = useState<[number, number] | null>(null);
    useMapEvents({
      mousemove(e) { setLl([e.latlng.lat, e.latlng.lng]); },
      mouseout() { setLl(null); }
    });
    if (!ll) return null;
    return (
      <Box sx={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', bgcolor: 'rgba(15,18,36,0.75)', color: '#cbd5e1', px: 1.5, py: 0.5, borderRadius: 1, fontSize: 12, zIndex: 1200 }}>
        {`Lat: ${ll[0].toFixed(3)}\u00B0  Lon: ${ll[1].toFixed(3)}\u00B0`}
      </Box>
    );
  };

  const GraticuleLayer: React.FC<{ step?: number }> = ({ step = 10 }) => {
    const map = useMap();
    const layerRef = React.useRef<L.LayerGroup | null>(null);
    React.useEffect(() => {
      if (!layerRef.current) layerRef.current = L.layerGroup().addTo(map);
      const draw = () => {
        const layer = layerRef.current!;
        layer.clearLayers();
        const b = map.getBounds();
        const south = Math.floor(b.getSouth() / step) * step;
        const north = Math.ceil(b.getNorth() / step) * step;
        const west = Math.floor(b.getWest() / step) * step;
        const east = Math.ceil(b.getEast() / step) * step;
        const style: L.PolylineOptions = { color: '#334155', weight: 1, opacity: 0.6 };
        for (let lat = south; lat <= north; lat += step) layer.addLayer(L.polyline([[lat, west], [lat, east]], style));
        for (let lng = west; lng <= east; lng += step) layer.addLayer(L.polyline([[south, lng], [north, lng]], style));
      };
      draw();
      map.on('moveend', draw);
      return () => { map.off('moveend', draw); if (layerRef.current) { map.removeLayer(layerRef.current); layerRef.current = null; } };
    }, [map, step]);
    return null;
  };

  const ViewportReporter: React.FC = () => {
    const map = useMap();
    useMapEvents({ moveend() { const c = map.getCenter(); onViewportChange?.({ lat: c.lat, lng: c.lng, zoom: map.getZoom() }); }});
    return null;
  };

  const MeasureLayer: React.FC<{ enabled: boolean; onEnd?: () => void }> = ({ enabled, onEnd }) => {
    const map = useMap();
    const layerRef = React.useRef<L.LayerGroup | null>(null);
    const lineRef = React.useRef<L.Polyline | null>(null);
    const tipsRef = React.useRef<L.Tooltip | null>(null);
    const pointsRef = React.useRef<L.LatLng[]>([]);

    React.useEffect(() => {
      if (!layerRef.current) layerRef.current = L.layerGroup().addTo(map);
      const layer = layerRef.current;
      // disable default double-click zoom while measuring
      const dcz = map.doubleClickZoom;
      if (enabled) dcz.disable(); else dcz.enable();
      const haversine = (a: L.LatLng, b: L.LatLng) => {
        const toRad = (x: number) => (x * Math.PI) / 180;
        const R = 6371; // km
        const dLat = toRad(b.lat - a.lat);
        const dLon = toRad(b.lng - a.lng);
        const lat1 = toRad(a.lat);
        const lat2 = toRad(b.lat);
        const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
        return 2 * R * Math.asin(Math.sqrt(h));
      };

      const redraw = () => {
        if (!lineRef.current) lineRef.current = L.polyline([], { color: '#22c55e', weight: 3 }).addTo(layer);
        lineRef.current.setLatLngs(pointsRef.current);
        let total = 0;
        for (let i = 1; i < pointsRef.current.length; i++) total += haversine(pointsRef.current[i - 1], pointsRef.current[i]);
        const last = pointsRef.current[pointsRef.current.length - 1];
        if (last) {
          if (!tipsRef.current) tipsRef.current = L.tooltip({ permanent: true, direction: 'top', offset: L.point(0, -6), className: 'measure-tooltip' });
          tipsRef.current.setLatLng(last).setContent(`Total: ${total.toFixed(2)} km`);
          tipsRef.current.addTo(layer);
        } else if (tipsRef.current) {
          layer.removeLayer(tipsRef.current);
          tipsRef.current = null;
        }
      };

      const onClick = (e: L.LeafletMouseEvent) => {
        if (!enabled) return;
        pointsRef.current.push(e.latlng);
        redraw();
      };
      const onDblClick = () => {
        if (!enabled) return;
        // end measurement: clear but keep layer for next session
        pointsRef.current = [];
        if (lineRef.current) { layer.removeLayer(lineRef.current); lineRef.current = null; }
        if (tipsRef.current) { layer.removeLayer(tipsRef.current); tipsRef.current = null; }
        onEnd?.();
      };

      map.on('click', onClick);
      const onKey = (ev: KeyboardEvent) => {
        if (!enabled) return;
        if (ev.key === 'Escape') {
          pointsRef.current = [];
          if (lineRef.current) { layer.removeLayer(lineRef.current); lineRef.current = null; }
          if (tipsRef.current) { layer.removeLayer(tipsRef.current); tipsRef.current = null; }
        }
      };
      document.addEventListener('keydown', onKey);
      map.on('dblclick', onDblClick);
      return () => {
        map.off('click', onClick);
        document.removeEventListener('keydown', onKey);
        map.off('dblclick', onDblClick);
        if (layerRef.current) { map.removeLayer(layerRef.current); layerRef.current = null; }
        lineRef.current = null; tipsRef.current = null; pointsRef.current = [];
        dcz.enable();
      };
    }, [map, enabled]);
    return null;
  };

  // Advanced measure layer with distance/area modes and units
  const MeasureLayerPro: React.FC<{
    enabled: boolean;
    onEnd?: () => void;
    mode: 'distance' | 'area';
    distanceUnit: 'km' | 'mi' | 'm';
    areaUnit: 'km2' | 'mi2' | 'ha';
    pan: boolean;
    clearToken: number;
  }> = ({ enabled, onEnd, mode, distanceUnit, areaUnit, pan, clearToken }) => {
    const map = useMap();
    const layerRef = React.useRef<L.LayerGroup | null>(null);
    const lineRef = React.useRef<L.Polyline | null>(null);
    const polyRef = React.useRef<L.Polygon | null>(null);
    const tipsRef = React.useRef<L.Tooltip | null>(null);
    const segTipsRef = React.useRef<L.Tooltip[]>([]);
    const vertexRef = React.useRef<L.CircleMarker[]>([]);
    const savedRef = React.useRef<L.LayerGroup | null>(null);
    const cursorLineRef = React.useRef<L.Polyline | null>(null);
    const cursorTipRef = React.useRef<L.Tooltip | null>(null);
    const rendererRef = React.useRef<L.SVG | null>(null);
    const pointsRef = React.useRef<L.LatLng[]>([]);

    React.useEffect(() => {
      // ensure a high-zIndex pane for measurement graphics so they stay visible above heatmap/clusters
      const paneName = 'measure-pane';
      if (!map.getPane(paneName)) {
        map.createPane(paneName);
        const p = map.getPane(paneName)!;
        p.style.zIndex = '660'; // above markers (600) and close to tooltip (650)
        p.style.pointerEvents = 'none'; // don't intercept clicks; we listen on the map
      }
      if (!layerRef.current) layerRef.current = L.layerGroup().addTo(map);
      if (!savedRef.current) savedRef.current = L.layerGroup().addTo(map);
      if (!rendererRef.current) rendererRef.current = L.svg({ pane: paneName }).addTo(map);
      const layer = layerRef.current;
      const lockMap = (lock: boolean) => {
        const d = map as any;
        if (lock) {
          map.dragging.disable();
          map.scrollWheelZoom.disable();
          map.boxZoom.disable();
          map.keyboard.disable();
          (d.tap && d.tap.disable && d.tap.disable());
          map.touchZoom.disable();
          map.doubleClickZoom.disable();
        } else {
          map.dragging.enable();
          map.scrollWheelZoom.enable();
          map.boxZoom.enable();
          map.keyboard.enable();
          (d.tap && d.tap.enable && d.tap.enable());
          map.touchZoom.enable();
          map.doubleClickZoom.enable();
        }
      };
      lockMap(enabled && !pan);

      const kmTo = (km: number) => {
        if (distanceUnit === 'km') return `${km.toFixed(2)} km`;
        if (distanceUnit === 'mi') return `${(km * 0.621371).toFixed(2)} mi`;
        return `${Math.round(km * 1000)} m`;
      };

      const haversine = (a: L.LatLng, b: L.LatLng) => {
        const toRad = (x: number) => (x * Math.PI) / 180;
        const R = 6371; // km
        const dLat = toRad(b.lat - a.lat);
        const dLon = toRad(b.lng - a.lng);
        const lat1 = toRad(a.lat);
        const lat2 = toRad(b.lat);
        const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
        return 2 * R * Math.asin(Math.sqrt(h));
      };

      const projectToMeters = (latlngs: L.LatLng[]) => {
        const R = 6378137;
        return latlngs.map(p => {
          const x = R * (p.lng * Math.PI / 180);
          const y = R * Math.log(Math.tan(Math.PI / 4 + (p.lat * Math.PI / 180) / 2));
          return [x, y] as [number, number];
        });
      };
      const polygonAreaM2 = (latlngs: L.LatLng[]) => {
        if (latlngs.length < 3) return 0;
        const pts = projectToMeters(latlngs);
        let sum = 0;
        for (let i = 0; i < pts.length; i++) {
          const [x1, y1] = pts[i];
          const [x2, y2] = pts[(i + 1) % pts.length];
          sum += x1 * y2 - x2 * y1;
        }
        return Math.abs(sum) / 2;
      };
      const formatArea = (m2: number) => {
        if (areaUnit === 'km2') return `${(m2 / 1e6).toFixed(2)} km\u00B2`;
        if (areaUnit === 'mi2') return `${(m2 / 1e6 * 0.386102).toFixed(2)} mi\u00B2`;
        return `${(m2 / 10000).toFixed(2)} ha`;
      };

      const clearAll = () => {
        const layer = layerRef.current;
        const saved = savedRef.current;
        pointsRef.current = [];
        // remove live preview items (layer)
        if (layer) {
          if (cursorLineRef.current && (layer as any).hasLayer?.(cursorLineRef.current)) layer.removeLayer(cursorLineRef.current);
          if (cursorTipRef.current && (layer as any).hasLayer?.(cursorTipRef.current)) layer.removeLayer(cursorTipRef.current);
        }
        cursorLineRef.current = null; cursorTipRef.current = null;
        // remove persistent items (saved)
        if (saved) {
          if (lineRef.current && (saved as any).hasLayer?.(lineRef.current)) saved.removeLayer(lineRef.current);
          if (polyRef.current && (saved as any).hasLayer?.(polyRef.current)) saved.removeLayer(polyRef.current);
          segTipsRef.current.forEach(t => { if ((saved as any).hasLayer?.(t)) saved.removeLayer(t); });
          if (tipsRef.current && (saved as any).hasLayer?.(tipsRef.current)) saved.removeLayer(tipsRef.current);
          vertexRef.current.forEach(m => { if ((saved as any).hasLayer?.(m)) saved.removeLayer(m); });
        }
        lineRef.current = null; polyRef.current = null; tipsRef.current = null; segTipsRef.current = [];
        vertexRef.current = [];
      };

      const clearAllHard = () => {
        clearAll();
        if (savedRef.current) savedRef.current.clearLayers();
      };

      const redraw = () => {
        const layer = layerRef.current!;
        // remove previous segment tips from live layer
        segTipsRef.current.forEach(t => layer.removeLayer(t));
        segTipsRef.current = [];
        if (mode === 'distance') {
          if (!lineRef.current) lineRef.current = L.polyline([], { color: '#22c55e', weight: 3, pane: 'measure-pane', renderer: rendererRef.current! }).addTo(layer);
          if (polyRef.current) { layer.removeLayer(polyRef.current); polyRef.current = null; }
          lineRef.current.setLatLngs(pointsRef.current);
          if (lineRef.current.bringToFront) lineRef.current.bringToFront();
          // draw vertex markers (live)
          vertexRef.current.forEach(m => layer.removeLayer(m));
          vertexRef.current = pointsRef.current.map(p => L.circleMarker(p, { radius: 4, color: '#22c55e', weight: 2, fillColor: '#0f172a', fillOpacity: 0.9, pane: 'measure-pane', renderer: rendererRef.current! }).addTo(layer));
          for (let i = 1; i < pointsRef.current.length; i++) {
            const a = pointsRef.current[i - 1];
            const b = pointsRef.current[i];
            const mid = L.latLng((a.lat + b.lat) / 2, (a.lng + b.lng) / 2);
            const lenKm = haversine(a, b);
            const tip = L.tooltip({ permanent: true, direction: 'top', offset: L.point(0, -4), className: 'measure-seg' })
              .setLatLng(mid).setContent(kmTo(lenKm));
            tip.addTo(layer);
            segTipsRef.current.push(tip);
          }
          const last = pointsRef.current[pointsRef.current.length - 1];
          const totalKm = pointsRef.current.reduce((acc, cur, idx, arr) => idx ? acc + haversine(arr[idx - 1], cur) : 0, 0);
          if (last) {
            if (!tipsRef.current) tipsRef.current = L.tooltip({ permanent: true, direction: 'top', offset: L.point(0, -6), className: 'measure-tooltip' });
            tipsRef.current.setLatLng(last).setContent(`Total: ${kmTo(totalKm)}`);
            tipsRef.current.addTo(layer);
          } else if (tipsRef.current) {
            layer.removeLayer(tipsRef.current);
            tipsRef.current = null;
          }
        } else {
          if (lineRef.current) { layer.removeLayer(lineRef.current); lineRef.current = null; }
          if (!polyRef.current) polyRef.current = L.polygon([], { color: '#22c55e', weight: 2, fillOpacity: 0.1, pane: 'measure-pane', renderer: rendererRef.current! }).addTo(layer);
          polyRef.current.setLatLngs(pointsRef.current);
          if (polyRef.current.bringToFront) polyRef.current.bringToFront();
          // draw vertex markers (live)
          vertexRef.current.forEach(m => layer.removeLayer(m));
          vertexRef.current = pointsRef.current.map(p => L.circleMarker(p, { radius: 4, color: '#22c55e', weight: 2, fillColor: '#0f172a', fillOpacity: 0.9, pane: 'measure-pane', renderer: rendererRef.current! }).addTo(layer));
          const m2 = polygonAreaM2(pointsRef.current);
          if (pointsRef.current.length >= 3 && m2 > 0) {
            const center = polyRef.current.getBounds().getCenter();
            if (!tipsRef.current) tipsRef.current = L.tooltip({ permanent: true, direction: 'top', offset: L.point(0, -6), className: 'measure-tooltip' });
            tipsRef.current.setLatLng(center).setContent(`Area: ${formatArea(m2)}`);
            tipsRef.current.addTo(layer);
          } else if (tipsRef.current) {
            layer.removeLayer(tipsRef.current);
            tipsRef.current = null;
          }
        }
      };

      const onClick = (e: L.LeafletMouseEvent) => {
        if (!enabled || pan) return;
        pointsRef.current.push(e.latlng);
        // draw immediate vertex anchor to avoid any flicker
        if (layerRef.current) {
          const v = L.circleMarker(e.latlng, { radius: 4, color: '#22c55e', weight: 2, fillColor: '#0f172a', fillOpacity: 0.9, pane: 'measure-pane', renderer: rendererRef.current! });
          v.addTo(layerRef.current);
          vertexRef.current.push(v);
        }
        redraw();
      };
      const onDblClick = () => {
        if (!enabled) return;
        const pts = pointsRef.current.slice();
        const saved = savedRef.current ?? L.layerGroup().addTo(map);
        savedRef.current = saved;
        if ((mode === 'distance' && pts.length >= 2) || (mode === 'area' && pts.length >= 3)) {
          if (mode === 'distance') {
            const pl = L.polyline(pts, { color: '#22c55e', weight: 3, pane: 'measure-pane', renderer: rendererRef.current! }).addTo(saved);
            // vertices
            pts.forEach(p => L.circleMarker(p, { radius: 4, color: '#22c55e', weight: 2, fillColor: '#0f172a', fillOpacity: 0.9, pane: 'measure-pane', renderer: rendererRef.current! }).addTo(saved));
            // per-segment labels
            for (let i = 1; i < pts.length; i++) {
              const a = pts[i - 1], b = pts[i];
              const mid = L.latLng((a.lat + b.lat) / 2, (a.lng + b.lng) / 2);
              const lenKm = haversine(a, b);
              L.tooltip({ permanent: true, direction: 'top', offset: L.point(0, -4), className: 'measure-seg' })
                .setLatLng(mid).setContent(kmTo(lenKm)).addTo(saved);
            }
            const totalKm = pts.reduce((acc, cur, idx, arr) => idx ? acc + haversine(arr[idx - 1], cur) : 0, 0);
            const last = pts[pts.length - 1];
            L.tooltip({ permanent: true, direction: 'top', offset: L.point(0, -6), className: 'measure-tooltip' })
              .setLatLng(last).setContent(`Total: ${kmTo(totalKm)}`).addTo(saved);
          } else {
            const pg = L.polygon(pts, { color: '#22c55e', weight: 2, fillOpacity: 0.1, pane: 'measure-pane', renderer: rendererRef.current! }).addTo(saved);
            pts.forEach(p => L.circleMarker(p, { radius: 4, color: '#22c55e', weight: 2, fillColor: '#0f172a', fillOpacity: 0.9, pane: 'measure-pane', renderer: rendererRef.current! }).addTo(saved));
            const m2 = polygonAreaM2(pts);
            const center = pg.getBounds().getCenter();
            L.tooltip({ permanent: true, direction: 'top', offset: L.point(0, -6), className: 'measure-tooltip' })
              .setLatLng(center).setContent(`Area: ${formatArea(m2)}`).addTo(saved);
          }
        }
        // clear live layer (preview + in-progress)
        if (layerRef.current) layerRef.current.clearLayers();
        lineRef.current = null; polyRef.current = null; cursorLineRef.current = null; cursorTipRef.current = null; tipsRef.current = null;
        segTipsRef.current = []; vertexRef.current = []; pointsRef.current = [];
        onEnd?.();
      };

      const onKey = (ev: KeyboardEvent) => {
        if (!enabled) return;
        if (ev.key === 'Escape') clearAll();
      };

      const onMove = (e: L.LeafletMouseEvent) => {
        if (!enabled || pan) return;
        if (pointsRef.current.length === 0) return;
        const last = pointsRef.current[pointsRef.current.length - 1];
        const curr = e.latlng;
        if (mode === 'distance') {
          const saved = savedRef.current!;
          const pts = pointsRef.current.concat([curr]);
          if (!cursorLineRef.current) cursorLineRef.current = L.polyline(pts, { color: '#22c55e', weight: 2, dashArray: '4 4', pane: 'measure-pane', renderer: rendererRef.current! }).addTo(layer);
          cursorLineRef.current.setLatLngs(pts);
          const baseKm = pointsRef.current.reduce((acc, p, i, arr) => i ? acc + haversine(arr[i - 1], p) : 0, 0);
          const lenKm = baseKm + (pointsRef.current.length ? haversine(pointsRef.current[pointsRef.current.length - 1], curr) : 0);
          if (!cursorTipRef.current) cursorTipRef.current = L.tooltip({ permanent: true, direction: 'top', offset: L.point(0, -6), className: 'measure-tip' });
          cursorTipRef.current.setLatLng(curr).setContent(`Total: ${kmTo(lenKm)}`);
          cursorTipRef.current.addTo(layer);
        } else {
          // area preview: polygon with current cursor as the last vertex
          const pts = pointsRef.current.concat([curr]);
          if (!polyRef.current) polyRef.current = L.polygon([], { color: '#22c55e', weight: 2, fillOpacity: 0.1, pane: 'measure-pane', renderer: rendererRef.current! }).addTo(layer);
          polyRef.current.setLatLngs(pts);
          const m2 = polygonAreaM2(pts.length >= 3 ? pts : []);
          if (m2 > 0) {
            const center = polyRef.current.getBounds().getCenter();
            if (!tipsRef.current) tipsRef.current = L.tooltip({ permanent: true, direction: 'top', offset: L.point(0, -6), className: 'measure-tooltip' });
            tipsRef.current.setLatLng(center).setContent(`Area: ${formatArea(m2)}`);
            tipsRef.current.addTo(layer);
          }
        }
      };

      map.on('click', onClick);
      map.on('dblclick', onDblClick);
      map.on('mousemove', onMove);
      document.addEventListener('keydown', onKey);

      if (clearToken) clearAllHard();

      // also react to clearToken changes explicitly to ensure clearing without relying on effect re-initialization timing
      // note: separate effect below also handles this, but keep for safety

      return () => {
        map.off('click', onClick);
        map.off('dblclick', onDblClick);
        map.off('mousemove', onMove);
        document.removeEventListener('keydown', onKey);
        if (layerRef.current) { map.removeLayer(layerRef.current); layerRef.current = null; }
        if (savedRef.current) { /* keep saved results when unmounting measure */ }
        lineRef.current = null; polyRef.current = null; tipsRef.current = null; segTipsRef.current = [] as any; cursorLineRef.current = null; cursorTipRef.current = null;
        pointsRef.current = [];
        lockMap(false);
      };
    }, [map, enabled, mode, distanceUnit, areaUnit, pan, clearToken]);

    // strong clear handler tied to clearToken
    React.useEffect(() => {
      if (!clearToken) return;
      // clear everything from both live and saved groups
      const saved = savedRef.current; const layer = layerRef.current;
      if (saved) saved.clearLayers();
      if (layer) layer.clearLayers();
      lineRef.current = null; polyRef.current = null; tipsRef.current = null; cursorLineRef.current = null; cursorTipRef.current = null;
      segTipsRef.current = []; vertexRef.current = []; pointsRef.current = [];
    }, [clearToken]);
    return null;
  };

  const LocationLayer: React.FC<{ enabled: boolean; onPlaced?: () => void }> = ({ enabled, onPlaced }) => {
    const map = useMap();
    const markerRef = React.useRef<L.Marker | null>(null);

    React.useEffect(() => {
      const dcz = map.doubleClickZoom;
      if (enabled) dcz.disable(); else dcz.enable();
      const onClick = (e: L.LeafletMouseEvent) => {
        if (!enabled) return;
        if (markerRef.current) { map.removeLayer(markerRef.current); markerRef.current = null; }
        const { lat, lng } = e.latlng;
        const marker = L.marker([lat, lng]).addTo(map);
        markerRef.current = marker;
        const text = `Lat: ${lat.toFixed(6)}, Lon: ${lng.toFixed(6)}`;
        const html = `<div style="font-size:12px;line-height:1.3">${text} <a href="#" id="copy-ll">濠电姰鍨煎▔娑氱矓閹绢喖鏄?/a></div>`;
        marker.bindPopup(html).openPopup();
        setTimeout(() => {
          const el = document.getElementById('copy-ll');
          if (el) el.onclick = (ev) => { ev.preventDefault(); navigator.clipboard?.writeText(text); };
        }, 0);
        onPlaced?.();
      };
      map.on('click', onClick);
      return () => { map.off('click', onClick); if (markerRef.current) { map.removeLayer(markerRef.current); markerRef.current = null; } dcz.enable(); };
    }, [map, enabled, onPlaced]);
    return null;
  };

  const renderMap = () => (
    <MapContainer
      center={[35.0, 105.0]}
      zoom={4}
      className={`flex-grow w-full h-full ${measureMode ? 'l-interact-off' : ''}`}
      style={{ height: '100vh' }}
    >
      <ScaleControl position="bottomleft" />
      <ViewportReporter />
      <ScaleControl position="bottomleft" />
      <MouseCoordsFixed />
      <MeasureLayerPro enabled={measureMode} onEnd={() => setMeasureMode(false)} mode={measureType} distanceUnit={distanceUnit} areaUnit={areaUnit} pan={panMode} clearToken={measureClearToken} />
      {(() => {
        const base = baseLayer;
        if (base === 'esri') {
          return (
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
            />
          );
        }
        if (base === 'carto-dark') {
          return (
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
            />
          );
        }
        if (base === 'stamen-toner') {
          return (
            <TileLayer
              url="https://stamen-tiles.a.ssl.fastly.net/toner/{z}/{x}/{y}.png"
              attribution='Map tiles by Stamen Design, CC BY 3.0 &mdash; Map data &copy; OpenStreetMap contributors'
            />
          );
        }
        if (base === 'topo') {
          return (
            <TileLayer
              url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
              attribution='Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap (CC-BY-SA)'
            />
          );
        }
        if (base === 'blue-marble') {
          return (
            <TileLayer
              url="https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/BlueMarble_ShadedRelief/default/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg"
              attribution='Imagery courtesy NASA GIBS'
            />
          );
        }
        return (
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />
        );
      })()}
      {showCountryOutline && (
        <TileLayer
          url="https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
          attribution='Tiles &copy; Esri'
        />
      )}
      {showStreetsRef && (
        <TileLayer
          url="https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}"
          attribution='&copy; Esri Transportation'
        />
      )}
      {showGraticule && <GraticuleLayer step={10} />}
      {displayCollection.features.length > 0 && (
        <>
          {showHeatmap && (
            <FireHeatmap
              fireCollection={displayCollection}
              weightBy={weightBy}
              threshold={threshold}
              max={maxWeight}
            />
          )}
          {showCluster && <FireCluster fireCollection={displayCollection} interactionDisabled={measureMode} />}
        </>
      )}
    </MapContainer>
  );

  const renderCharts = () => null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: '#0b1020' }}>
      <AppBar position="fixed" color="default" sx={{ background: 'rgba(15,18,36,0.9)', backdropFilter: 'blur(6px)' }}>
        <Toolbar>
          <Typography variant="h6" sx={{ color: '#d7e3ff', letterSpacing: '0.5px' }}>FIRMS Wildfire Explorer</Typography>
          <Box sx={{ flexGrow: 1 }} />
          {currentDate && (
            <Typography variant="body2" sx={{ color: '#94a3b8' }}>Date: {currentDate}</Typography>
          )}
        </Toolbar>
      </AppBar>
      <Toolbar />

      {/* Search Form */}
      <Box sx={{ position: 'absolute', top: 80, left: 16, zIndex: 1000 }}>
        <SearchForm onSearch={onSearch} />
      </Box>

      {/* Visualization Controls */}
      {renderVisualizationControls()}

      {/* Main Map */}
      {renderMap()}

      {/* Time Slider: keep visible even if current day has 0 points */}
      {dates.length > 0 && searchParams && (
        <TimeSlider
          dates={dates}
          currentDate={currentDate}
          onTimeChange={onDateChange}
          params={searchParams}
          onQuickRange={onQuickRange}
          onRangeChange={(s, e) => setRangeDates({ start: s, end: e })}
        />
      )}

      {/* Statistics and Charts Panel */}
      {renderCharts()}

      {/* Bottom toolbar */}
      <Box sx={{ position: 'absolute', bottom: 90, left: '50%', transform: 'translateX(-50%)', zIndex: 1000 }}>
        <Paper elevation={6} sx={{ p: 1, bgcolor: 'rgba(16,20,35,0.9)' }}>
          <Stack direction="row" spacing={1}>
            <Button size="small" variant={measureMode ? 'contained' : 'outlined'} color={measureMode ? 'warning' : 'info'} onClick={() => { setMeasureMode(v => !v); }}>MEASURE</Button>
            <Button size="small" variant="outlined" color="info" onClick={() => { controlsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); controlsRef.current?.focus(); setHighlightLayers(true); setTimeout(() => setHighlightLayers(false), 1200); }}>LAYERS</Button>
            <Button size="small" variant="contained" color="warning" onClick={() => setActiveTab('trend')}>TIMELINE</Button>
            <Button size="small" variant="outlined" color="info" onClick={() => {
              const url = window.location.origin + window.location.pathname + window.location.hash;
              navigator.clipboard?.writeText(url);
              alert('Share link copied');
            }}>SHARE</Button>
            <Button size="small" variant="outlined" color="info" onClick={() => setHelpOpen(true)}>HELP</Button>
          </Stack>
        </Paper>
      </Box>
      {measureMode && (
        <Box sx={{ position: 'absolute', bottom: 160, left: 16, zIndex: 1200 }}>
          <Paper elevation={6} sx={{ p: 1.5, minWidth: 260, bgcolor: 'rgba(16,20,35,0.95)' }}>
            <Typography variant="subtitle2" sx={{ mb: 1, color: '#e2e8f0' }}>MEASURE TOOL</Typography>
            <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
              <Button size="small" variant={measureType === 'distance' ? 'contained' : 'outlined'} color="warning" onClick={() => setMeasureType('distance')}>DISTANCE</Button>
              <Button size="small" variant={measureType === 'area' ? 'contained' : 'outlined'} color="warning" onClick={() => setMeasureType('area')}>AREA</Button>
              <Button size="small" variant={panMode ? 'contained' : 'outlined'} color="info" onClick={() => setPanMode(v => !v)}>PAN</Button>
              <Button size="small" variant="outlined" color="error" onClick={() => setMeasureClearToken(t => t + 1)}>CLEAR</Button>
            </Stack>
            {measureType === 'distance' ? (
              <FormControl size="small" fullWidth>
                <InputLabel id="unit-dist">Units</InputLabel>
                <Select labelId="unit-dist" label="Units" value={distanceUnit} onChange={(e) => setDistanceUnit(e.target.value as any)}
                  MenuProps={{ PaperProps: { sx: { zIndex: 20000 } }, slotProps: { paper: { sx: { zIndex: 20000 } } }, disablePortal: false, container: document.body }}>
                  <MenuItem value="km">km</MenuItem>
                  <MenuItem value="mi">mi</MenuItem>
                  <MenuItem value="m">m</MenuItem>
                </Select>
              </FormControl>
            ) : (
              <FormControl size="small" fullWidth>
                <InputLabel id="unit-area">Units</InputLabel>
                <Select labelId="unit-area" label="Units" value={areaUnit} onChange={(e) => setAreaUnit(e.target.value as any)}
                  MenuProps={{ PaperProps: { sx: { zIndex: 20000 } }, slotProps: { paper: { sx: { zIndex: 20000 } } }, disablePortal: false, container: document.body }}>
                  <MenuItem value="km2">km虏</MenuItem>
                  <MenuItem value="mi2">mi虏</MenuItem>
                  <MenuItem value="ha">ha</MenuItem>
                </Select>
              </FormControl>
            )}
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Click to add points; double-click to finish. Press ESC to cancel.
            </Typography>
          </Paper>
        </Box>
      )}
            <Dialog open={helpOpen} onClose={() => setHelpOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Help</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle2" sx={{ mt: 1 }}>Legend</Typography>
          <Typography variant="body2" color="text.secondary">
            Heatmap gradient (left low to right high). Cluster size/color reflects count levels (10/50/100/200+).
          </Typography>
          <Box sx={{ my: 1, height: 10, borderRadius: 1, background: 'linear-gradient(90deg, #440154, #3b528b, #21918c, #5ec962, #fde725)' }} />
          <Typography variant="subtitle2" sx={{ mt: 2 }}>Filter</Typography>
          <Typography variant="body2" color="text.secondary">
            Filter by FRP or Brightness; Apply to Analytics syncs to Statistics/Trend/Radar.
          </Typography>
          <Typography variant="subtitle2" sx={{ mt: 2 }}>Timeline</Typography>
          <Typography variant="body2" color="text.secondary">
            Supports range selection (dual slider) and single-day selection. Labels adapt to range length; current day is highlighted.
          </Typography>
          <Typography variant="subtitle2" sx={{ mt: 2 }}>Measure</Typography>
          <Typography variant="body2" color="text.secondary">
            Click to add points; double-click to finish.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Note: The Location feature has been removed.
          </Typography>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default FireMap;
