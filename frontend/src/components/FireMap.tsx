import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// 修复 Leaflet 默认图标问题
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

interface FireData {
  latitude: number;
  longitude: number;
  acq_date: string;
  acq_time?: string;
  confidence?: string;
  frp?: number;
  [key: string]: any;
}

interface FireMapProps {
  fires: FireData[];
}

const FireMap: React.FC<FireMapProps> = ({ fires }) => {
  return (
    <MapContainer
      center={[0, 0]}
      zoom={2}
      style={{ height: "500px", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {fires.map((fire, index) => (
        <Marker
          key={`${fire.latitude}-${fire.longitude}-${index}`}
          position={[fire.latitude, fire.longitude]}
        >
          <Popup>
            <div>
              <div><strong>日期：</strong>{fire.acq_date}</div>
              {fire.acq_time && <div><strong>时间：</strong>{fire.acq_time}</div>}
              {fire.confidence && <div><strong>置信度：</strong>{fire.confidence}</div>}
              {fire.frp && <div><strong>火辐射功率：</strong>{fire.frp}</div>}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default FireMap; 