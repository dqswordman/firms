import { useEffect } from 'react';
import type { Map } from 'leaflet';
import { useMap } from 'react-leaflet';
import { useMapStore } from '../../../stores';

type MapHandler = {
  enable?: () => void;
  disable?: () => void;
};

const HANDLERS = ['dragging', 'scrollWheelZoom', 'doubleClickZoom', 'boxZoom', 'keyboard', 'touchZoom'] as const;

type HandlerKey = (typeof HANDLERS)[number];

const toggleInteraction = (map: Map, enabled: boolean): void => {
  const controls = map as Map & Record<HandlerKey, MapHandler>;
  HANDLERS.forEach((key) => {
    const handler = controls[key];
    if (!handler) {
      return;
    }

    if (enabled) {
      handler.enable?.();
    } else {
      handler.disable?.();
    }
  });

  const container = map.getContainer();
  container.classList.toggle('is-map-interactions-disabled', !enabled);
};

export const useMapInteractions = (): void => {
  const map = useMap();
  const isInteractionEnabled = useMapStore((state) => state.isInteractionEnabled);

  useEffect(() => {
    if (!map) {
      return;
    }

    toggleInteraction(map, isInteractionEnabled);

    return () => {
      toggleInteraction(map, true);
    };
  }, [map, isInteractionEnabled]);
};
