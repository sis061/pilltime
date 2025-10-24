/*
 * PREFIX
 * open-
 * fetch-
 */

import { create } from "zustand";

interface LoadingState {
  /** 현재 활성화된 로딩 ID (여러 개일 경우 마지막 요청 기준) */
  activeId?: string | null;
  /** 로딩 여부 */
  isGLoading: boolean;
  /** 로딩 메시지 (선택적) */
  loadingMessage?: string | null;

  /** 로딩 시작: 특정 id 로 지정 */
  startLoading: (id: string, message?: string) => void;

  /** 로딩 종료: 같은 id 일 때만 종료 */
  stopLoading: (id: string) => void;

  /** 강제 종료 (id 무시) */
  forceStop: () => void;
}

export const useGlobalLoading = create<LoadingState>((set, get) => ({
  activeId: null,
  isGLoading: false,
  loadingMessage: null,

  startLoading: (id, message) => {
    set({
      activeId: id,
      isGLoading: true,
      loadingMessage: message ?? null,
    });
  },

  stopLoading: (id) => {
    const { activeId } = get();
    if (activeId === id) {
      set({ isGLoading: false, activeId: null, loadingMessage: null });
    }
  },

  forceStop: () =>
    set({ isGLoading: false, activeId: null, loadingMessage: null }),
}));
