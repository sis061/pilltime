/*
 * COMMON PREFIX
 * open-
 * fetch-
 * upload-
 */

import { create } from "zustand";

interface LoadingState {
  /** 현재 활성화된 로딩 ID (여러 개일 경우 마지막 요청 기준) */
  activeId?: string | null;
  /** 로딩 여부 */
  isGLoading: boolean;
  /** 로딩 메시지 (선택적) */
  loadingMessage?: string | null;

  /** 일정 시간 초과 시 폴백 */
  timedOut: boolean;
  _timer?: ReturnType<typeof setTimeout> | null;

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
  timedOut: false,
  _timer: null,

  startLoading: (id, message) => {
    const prevTimer = get()._timer;
    if (prevTimer) clearTimeout(prevTimer);

    set({
      activeId: id,
      isGLoading: true,
      loadingMessage: message ?? "정보를 불러오고 있어요..",
      timedOut: false,
      _timer: null,
    });

    // 기본 15초 후 타임아웃 상태로 전환
    const timer = setTimeout(() => {
      const { activeId } = get();
      if (activeId === id) {
        set({
          timedOut: true,
          loadingMessage:
            "요청이 지연되고 있어요. 새로고침하거나 잠시 후 다시 시도해주세요.",
          _timer: null,
        });
      }
    }, 12345);

    set({ _timer: timer });
  },

  stopLoading: (id) => {
    const { activeId, _timer } = get();
    if (activeId === id) {
      if (_timer) clearTimeout(_timer);
      set({
        isGLoading: false,
        activeId: null,
        loadingMessage: null,
        timedOut: false,
        _timer: null,
      });
    }
  },

  forceStop: () => {
    const { _timer } = get();
    if (_timer) clearTimeout(_timer);
    set({
      isGLoading: false,
      activeId: null,
      loadingMessage: null,
      timedOut: false,
      _timer: null,
    });
  },
}));
