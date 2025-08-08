import React, { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import Supercluster from 'supercluster';
import { FireFeatureCollection, FirePoint } from '../types';

interface FireClusterProps {
  fireCollection: FireFeatureCollection;
}

const FireCluster: React.FC<FireClusterProps> = ({ fireCollection }) => {
  const map = useMap();
  const indexRef = useRef<Supercluster<any, any> | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  const getColorForConfidence = (confidence: string | undefined): string => {
    if (!confidence) return '#808080';

    const conf = confidence.toLowerCase();
    if (conf === 'h' || (conf.match(/^\d+$/) && parseInt(conf) >= 80)) {
      return '#FF0000';
    } else if (conf === 'n' || (conf.match(/^\d+$/) && parseInt(conf) >= 30)) {
      return '#FFA500';
    }
    return '#FFFF00';
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
        const marker = L.marker([lat, lng], {
          icon: L.divIcon({
            html: `<div style="
              background-color:#ff4500;
              width:40px;height:40px;
              border-radius:50%;
              display:flex;align-items:center;
              justify-content:center;
              color:white;font-weight:bold;">
              ${count}</div>`,
            className: 'supercluster-marker',
            iconSize: L.point(40, 40),
          }),
        });

        marker.on('click', () => {
          const expansionZoom = index.getClusterExpansionZoom(cluster.id);
          map.setView([lat, lng], expansionZoom);
        });

        layer.addLayer(marker);
      } else {
        const point = cluster.properties as FirePoint;
        const marker = L.circleMarker([lat, lng], {
          radius: 5,
          fillColor: getColorForConfidence(point.confidence),
          fillOpacity: 0.7,
          color: 'transparent',
        });

        let popupContent = `
          <div class="text-sm">
            <h3 class="font-bold mb-2">Fire Point Details</h3>
        `;

        if (point.confidence) {
          popupContent += `<p><span class="font-semibold">Confidence:</span> ${point.confidence}</p>`;
        }

        if (point.bright_ti4 && !isNaN(parseFloat(point.bright_ti4))) {
          popupContent += `<p><span class="font-semibold">Brightness (TI4):</span> ${parseFloat(point.bright_ti4).toFixed(2)}K</p>`;
        }

        if (point.bright_ti5 && !isNaN(parseFloat(point.bright_ti5))) {
          popupContent += `<p><span class="font-semibold">Brightness (TI5):</span> ${parseFloat(point.bright_ti5).toFixed(2)}K</p>`;
        }

        popupContent += `<p><span class="font-semibold">Date:</span> ${point.acq_date || 'Unknown'}</p>`;

        if (point.acq_time) {
          popupContent += `<p><span class="font-semibold">Time:</span> ${point.acq_time}</p>`;
        }

        if (point.satellite) {
          popupContent += `<p><span class="font-semibold">Satellite:</span> ${point.satellite}</p>`;
        }

        if (point.frp && !isNaN(parseFloat(point.frp))) {
          popupContent += `<p><span class="font-semibold">Radiative Power:</span> ${parseFloat(point.frp).toFixed(2)} MW</p>`;
        }

        if (point.country_id) {
          popupContent += `<p><span class="font-semibold">Country:</span> ${point.country_id}</p>`;
        }

        if (point.daynight) {
          popupContent += `<p><span class="font-semibold">Day/Night:</span> ${point.daynight === 'D' ? 'Day' : 'Night'}</p>`;
        }

        if (point.instrument) {
          popupContent += `<p><span class="font-semibold">Instrument:</span> ${point.instrument}</p>`;
        }

        if (point.scan) {
          popupContent += `<p><span class="font-semibold">Scan:</span> ${point.scan}</p>`;
        }

        if (point.track) {
          popupContent += `<p><span class="font-semibold">Track:</span> ${point.track}</p>`;
        }

        if (point.version) {
          popupContent += `<p><span class="font-semibold">Version:</span> ${point.version}</p>`;
        }

        popupContent += `</div>`;

        marker.bindPopup(popupContent);
        layer.addLayer(marker);
      }
    });
  };

  useEffect(() => {
    indexRef.current = new Supercluster({
      radius: 40,
      maxZoom: 16,
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

