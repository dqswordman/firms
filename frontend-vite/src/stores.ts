import { create } from 'zustand';

interface AppState {
  stage: number;
}

export const useAppStore = create<AppState>(() => ({
  stage: 1,
}));
