import React, { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import Supercluster from 'supercluster';
import { FireFeatureCollection, FirePoint } from '../types';

interface FireClusterProps {
  fireCollection: FireFeatureCollection;
  interactionDisabled?: boolean;
}

const FireCluster: React.FC<FireClusterProps> = ({ fireCollection, interactionDisabled }) => {
  const map = useMap();
  const indexRef = useRef<Supercluster<any, any> | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  const getColorForConfidence = (confidence: string | number | undefined): string => {
    if (confidence === undefined || confidence === null) return '#808080';
    if (typeof confidence === 'number') {
      if (confidence >= 80) return '#FF0000';
      if (confidence >= 30) return '#FFA500';
      return '#FFFF00';
    }
    const conf = confidence.toLowerCase();
    if (conf === 'h' || (conf.match(/^\d+$/) && parseInt(conf) >= 80)) {
      return '#FF0000';
    } else if (conf === 'n' || (conf.match(/^\d+$/) && parseInt(conf) >= 30)) {
      return '#FFA500';
    }
    return '#FFFF00';
  };

  const clusterIcon = (count: number, mute?: boolean) => {
    // Adaptive size and color based on count
    const size = count > 1000 ? 48 : count > 200 ? 40 : count > 50 ? 34 : count > 10 ? 28 : 24;
    const color = count > 1000 ? '#b91c1c' : count > 200 ? '#ea580c' : count > 50 ? '#f59e0b' : '#22c55e';
    const border = '#0f172a';
    const shadow = '0 2px 6px rgba(0,0,0,0.25)';
    const html = `
      <div style="
        width:${size}px;height:${size}px;
        border-radius:50%;
        background:${color};
        box-shadow:${shadow};
        border:2px solid ${border};
        display:flex;align-items:center;justify-content:center;
        color:#fff; font-weight:700; font-size:12px;${mute ? 'pointer-events:none;' : ''}">
        ${count}
      </div>`;
    return L.divIcon({ html, className: 'supercluster-marker', iconSize: L.point(size, size) });
  };

  const pointRadius = (p: FirePoint): number => {
    const raw = p.frp as any;
    const frp = typeof raw === 'number' ? raw : (raw ? parseFloat(raw) : NaN);
    if (!isNaN(frp)) {
      if (frp > 80) return 7;
      if (frp > 40) return 6;
      if (frp > 15) return 5;
      return 4;
    }
    return 4;
  };

  const updateClusters = () => {
    const index = indexRef.current;
    if (!index) return;
    const bounds = map.getBounds();
    const zoom = map.getZoom();
    const clusters = index.getClusters(
      [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()],
      Math.round(zoom)
    );

    if (!layerRef.current) {
      layerRef.current = L.layerGroup();
      layerRef.current.addTo(map);
    }

    const layer = layerRef.current;
    layer.clearLayers();

    clusters.forEach((cluster: any) => {
      const [lng, lat] = cluster.geometry.coordinates;

      if (cluster.properties.cluster) {
        const count = cluster.properties.point_count;
        const sumFrp = (cluster.properties.sum_frp || 0) as number;
        const avgFrp = count > 0 ? (sumFrp / count) : 0;
        const marker = L.marker([lat, lng], { icon: clusterIcon(count, interactionDisabled) });

        marker.on('click', () => {
          const expansionZoom = index.getClusterExpansionZoom(cluster.id);
          map.setView([lat, lng], expansionZoom);
        });

        if (!interactionDisabled) marker.bindTooltip(
          `<div style="padding:2px 6px;font-size:12px;">
            <div><strong>Count:</strong> ${count}</div>
            <div><strong>Avg FRP:</strong> ${avgFrp.toFixed(2)} MW</div>
          </div>`,
          { direction: 'top', offset: L.point(0, -4), opacity: 0.9 }
        );

        layer.addLayer(marker);
      } else {
        const point = cluster.properties as FirePoint;
        const marker = L.circleMarker([lat, lng], {
          radius: pointRadius(point),
          fillColor: getColorForConfidence(point.confidence),
          fillOpacity: 0.75,
          color: '#0f172a',
          weight: 1,
          interactive: !interactionDisabled,
        });

        let popupContent = `
          <div style="font-size:12px;line-height:1.25;max-width:240px;">
            <div style="font-weight:700;margin-bottom:6px;border-bottom:1px solid #e5e7eb;padding-bottom:4px;">Fire Point</div>
        `;

        if (point.confidence) {
          popupContent += `<div><span style="color:#475569">Confidence:</span> ${point.confidence}</div>`;
        }

        const b4 = point.bright_ti4 ? parseFloat(point.bright_ti4) : undefined;
        const b5 = point.bright_ti5 ? parseFloat(point.bright_ti5) : undefined;
        const b = typeof (point as any).brightness === 'number' ? (point as any).brightness as number : undefined;
        if (b !== undefined && !isNaN(b)) {
            popupContent += `<div><span style="color:#475569">Brightness:</span> ${b.toFixed(2)}K</div>`;
        } else {
          if (b4 !== undefined && !isNaN(b4)) {
            popupContent += `<div><span style="color:#475569">Brightness (TI4):</span> ${b4.toFixed(2)}K</div>`;
          }
          if (b5 !== undefined && !isNaN(b5)) {
            popupContent += `<div><span style="color:#475569">Brightness (TI5):</span> ${b5.toFixed(2)}K</div>`;
          }
        }

        const acqDt = (point as any).acq_datetime || (point.acq_date ? `${point.acq_date} ${point.acq_time || ''}` : 'Unknown');
        popupContent += `<div><span style="color:#475569">Acquired:</span> ${acqDt}</div>`;

        if (point.acq_time) {
          // time included above if present
        }

        if (point.satellite) {
          popupContent += `<div><span style="color:#475569">Satellite:</span> ${point.satellite}</div>`;
        }

        const frpVal = typeof point.frp === 'number' ? point.frp : (point.frp ? parseFloat(point.frp) : NaN);
        if (!isNaN(frpVal)) {
          popupContent += `<div><span style="color:#475569">Radiative Power:</span> ${frpVal.toFixed(2)} MW</div>`;
        }

        if (point.country_id) {
          popupContent += `<div><span style="color:#475569">Country:</span> ${point.country_id}</div>`;
        }

        if (point.daynight) {
          popupContent += `<div><span style="color:#475569">Day/Night:</span> ${point.daynight === 'D' ? 'Day' : 'Night'}</div>`;
        }

        if (point.instrument) {
          popupContent += `<div><span style="color:#475569">Instrument:</span> ${point.instrument}</div>`;
        }

        if (point.scan) {
          popupContent += `<div><span style="color:#475569">Scan:</span> ${point.scan}</div>`;
        }

        if (point.track) {
          popupContent += `<div><span style="color:#475569">Track:</span> ${point.track}</div>`;
        }

        if (point.version) {
          popupContent += `<div><span style="color:#475569">Version:</span> ${point.version}</div>`;
        }

        popupContent += `</div>`;

        marker.bindPopup(popupContent);
        layer.addLayer(marker);
      }
    });
  };

  useEffect(() => {
    indexRef.current = new Supercluster({
      radius: 32,
      maxZoom: 17,
    }).load(
      fireCollection.features.map((f) => ({
        type: 'Feature',
        properties: f.properties,
        geometry: {
          type: 'Point',
          coordinates: f.geometry.coordinates,
        },
      }))
    );
    updateClusters();
  }, [fireCollection]);

  useEffect(() => {
    map.on('moveend', updateClusters);
    return () => {
      map.off('moveend', updateClusters);
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [map]);

  return null;
};

export default FireCluster;
