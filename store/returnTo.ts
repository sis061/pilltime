import { create } from "zustand";

interface ReturnToStore {
  returnToStep: number | null;
  setReturnTo: (step: number) => void;
  popReturnTo: () => number | null; // 읽고 즉시 비우기
}

export const useReturnToStore = create<ReturnToStore>((set, get) => ({
  returnToStep: null,
  setReturnTo: (step) => set({ returnToStep: step }),
  popReturnTo: () => {
    const step = get().returnToStep;
    set({ returnToStep: null });
    return step;
  },
}));
