declare module '@changey/react-leaflet-markercluster' {
  import { FC, ReactNode } from 'react';
  import { MarkerClusterGroupOptions } from 'leaflet.markercluster';

  interface MarkerClusterGroupProps extends MarkerClusterGroupOptions {
    children?: ReactNode;
  }

  const MarkerClusterGroup: FC<MarkerClusterGroupProps>;
  export default MarkerClusterGroup;
} 