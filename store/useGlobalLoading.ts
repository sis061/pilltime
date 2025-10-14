import { create } from "zustand";

interface LoadingState {
  isGLoading: boolean;
  loadingMessage?: string | null;
  setGLoading: (active: boolean, message?: string) => void;
}

export const useGlobalLoading = create<LoadingState>((set) => ({
  isGLoading: false,
  loadingMessage: null,
  setGLoading: (active, message) =>
    set({
      isGLoading: active,
      loadingMessage: message ?? null,
    }),
}));
