import React, { useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import MarkerClusterGroup from '@changey/react-leaflet-markercluster';
import { FirePoint } from '../types';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

interface FireClusterProps {
  firePoints: FirePoint[];
}

const FireCluster: React.FC<FireClusterProps> = ({ firePoints }) => {
  // 根据置信度获取点的颜色
  const getColorByConfidence = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return '#FF0000'; // 红色 - 高置信度
      case 'medium':
        return '#FFA500'; // 橙色 - 中置信度
      case 'low':
        return '#FFFF00'; // 黄色 - 低置信度
      default:
        return '#808080'; // 灰色 - 未知置信度
    }
  };

  // 创建自定义图标
  const createCustomIcon = (point: FirePoint) => {
    const color = getColorByConfidence(point.confidence);
    return L.divIcon({
      className: 'custom-div-icon',
      html: `
        <div 
          style="
            background-color: ${color};
            width: 12px;
            height: 12px;
            border-radius: 50%;
            border: 1px solid white;
            box-shadow: 0 0 2px rgba(0,0,0,0.3);
          "
        />
      `,
      iconSize: [12, 12],
      iconAnchor: [6, 6],
      popupAnchor: [0, -6]
    });
  };

  // 配置聚类选项
  const clusterOptions = {
    maxClusterRadius: 50, // 聚合半径
    spiderfyOnMaxZoom: true, // 在最大缩放级别时展开
    showCoverageOnHover: false, // 禁用悬停时显示覆盖区域
    zoomToBoundsOnClick: true, // 点击时缩放到边界
    disableClusteringAtZoom: 12, // 在此缩放级别以上禁用聚合
    chunkedLoading: true, // 启用分块加载以提高性能
    // 自定义聚类图标样式
    iconCreateFunction: (cluster: any) => {
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
        html: `
          <div style="
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
          ">
            ${count}
          </div>
        `,
        className: `marker-cluster marker-cluster-${size}`,
        iconSize: L.point(iconSize, iconSize)
      });
    }
  };

  // 使用 useMemo 优化标记创建
  const markers = useMemo(() => {
    return firePoints.map((point, index) => {
      const lat = parseFloat(point.latitude);
      const lng = parseFloat(point.longitude);
      
      if (isNaN(lat) || isNaN(lng)) return null;

      return (
        <Marker
          key={`${point.acq_date}-${point.acq_time}-${index}`}
          position={[lat, lng]}
          icon={createCustomIcon(point)}
        >
          <Popup>
            <div className="text-sm">
              <p>亮度 (TI4): {parseFloat(point.bright_ti4).toFixed(2)}</p>
              <p>亮度 (TI5): {parseFloat(point.bright_ti5).toFixed(2)}</p>
              <p>日期: {point.acq_date}</p>
              <p>时间: {point.acq_time}</p>
              <p>卫星: {point.satellite}</p>
              <p>置信度: {point.confidence}</p>
              <p>辐射功率: {parseFloat(point.frp).toFixed(2)} MW</p>
              <p>国家: {point.country_id}</p>
              <p>昼夜: {point.daynight === 'D' ? '白天' : '夜间'}</p>
              <p>仪器: {point.instrument}</p>
              <p>扫描: {point.scan}</p>
              <p>轨道: {point.track}</p>
              <p>版本: {point.version}</p>
            </div>
          </Popup>
        </Marker>
      );
    }).filter(Boolean);
  }, [firePoints]);

  return (
    <MarkerClusterGroup {...clusterOptions}>
      {markers}
    </MarkerClusterGroup>
  );
};

export default FireCluster; 