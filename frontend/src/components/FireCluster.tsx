import React, { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { FireFeatureCollection, FirePoint } from '../types';

// Add type definitions for leaflet.markercluster
declare module 'leaflet' {
  interface MarkerClusterGroup extends L.Layer {
    clearLayers(): this;
    addLayer(layer: L.Layer): this;
  }

  interface MarkerCluster extends L.Layer {
    getChildCount(): number;
  }
}

interface FireClusterProps {
  fireCollection: FireFeatureCollection;
}

const FireCluster: React.FC<FireClusterProps> = ({ fireCollection }) => {
  const map = useMap();
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);

  const getColorForConfidence = (confidence: string | undefined): string => {
    if (!confidence) return '#808080'; // Gray for unknown confidence
    
    const conf = confidence.toLowerCase();
    if (conf === 'h' || (conf.match(/^\d+$/) && parseInt(conf) >= 80)) {
      return '#FF0000'; // Red for high confidence
    } else if (conf === 'n' || (conf.match(/^\d+$/) && parseInt(conf) >= 30)) {
      return '#FFA500'; // Orange for medium confidence
    }
    return '#FFFF00'; // Yellow for low confidence
  };

  useEffect(() => {
    if (!clusterGroupRef.current) {
      // Create marker cluster group using the global L.MarkerClusterGroup
      const clusterGroup = new (L as any).MarkerClusterGroup({
        maxClusterRadius: 50,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        disableClusteringAtZoom: 12,
        chunkedLoading: true,
        iconCreateFunction: (cluster: L.MarkerCluster) => {
          const count = cluster.getChildCount();
          let size = 'small';
          let color = '#FFA500';
          let fontSize = '12px';
          let iconSize = 30;

          if (count > 100) {
            size = 'large';
            color = '#FF0000';
            fontSize = '14px';
            iconSize = 40;
          } else if (count > 50) {
            size = 'medium';
            color = '#FF4500';
            fontSize = '13px';
            iconSize = 35;
          }

          return L.divIcon({
            html: `<div style="
              background-color: ${color};
              width: 100%;
              height: 100%;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: bold;
              font-size: ${fontSize};
              border: 2px solid white;
              box-shadow: 0 0 4px rgba(0,0,0,0.3);
            ">${count}</div>`,
            className: `marker-cluster marker-cluster-${size}`,
            iconSize: L.point(iconSize, iconSize)
          });
        }
      });

      // Store the reference and add to map
      clusterGroupRef.current = clusterGroup;
      map.addLayer(clusterGroup);
    }

    const clusterGroup = clusterGroupRef.current;
    if (!clusterGroup) return;

    // Clear existing markers
    clusterGroup.clearLayers();

    // Add new markers
    fireCollection.features.forEach((feature) => {
      const [lng, lat] = feature.geometry.coordinates;
      const point = feature.properties as FirePoint;

      if (isNaN(lat) || isNaN(lng)) {
        console.error('Invalid coordinates for point:', point);
        return;
      }

      const marker = L.circleMarker([lat, lng], {
        radius: 5,
        fillColor: getColorForConfidence(point.confidence),
        fillOpacity: 0.7,
        color: 'transparent'
      });

      // Safely build the popup content
      let popupContent = `
        <div class="text-sm">
          <h3 class="font-bold mb-2">Fire Point Details</h3>
      `;
      
      // Add fields only if they exist
      if (point.confidence) {
        popupContent += `<p><span class="font-semibold">Confidence:</span> ${point.confidence}</p>`;
      }
      
      if (point.bright_ti4 && !isNaN(parseFloat(point.bright_ti4))) {
        popupContent += `<p><span class="font-semibold">Brightness (TI4):</span> ${parseFloat(point.bright_ti4).toFixed(2)}K</p>`;
      }
      
      if (point.bright_ti5 && !isNaN(parseFloat(point.bright_ti5))) {
        popupContent += `<p><span class="font-semibold">Brightness (TI5):</span> ${parseFloat(point.bright_ti5).toFixed(2)}K</p>`;
      }
      
      // Date is a required field
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
      clusterGroup.addLayer(marker);
    });

    // Cleanup
    return () => {
      if (clusterGroupRef.current) {
        map.removeLayer(clusterGroupRef.current);
        clusterGroupRef.current = null;
      }
    };
  }, [map, fireCollection]);

  return null;
};

export default FireCluster; 