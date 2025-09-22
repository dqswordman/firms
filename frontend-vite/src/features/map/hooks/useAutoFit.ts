import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { useMapStore } from '../../../stores';

export const useAutoFit = (): void => {
  const map = useMap();
  const request = useMapStore((state) => state.autoFitRequest);
  const clearAutoFit = useMapStore((state) => state.clearAutoFit);

  useEffect(() => {
    if (!map || !request) {
      return;
    }

    map.fitBounds(request.bounds, { padding: request.padding });
    clearAutoFit();
  }, [map, request, clearAutoFit]);
};
