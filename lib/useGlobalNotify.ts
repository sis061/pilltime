"use client";
import useSWR, { mutate as globalMutate } from "swr";

const KEY = "/api/push/global";
const fetcher = (url: string) =>
  fetch(url, { cache: "no-store" }).then((r) => r.json());

/**
 * 전역 알림 상태 공유 훅 (SWR 캐시 기반)
 * - enabled: boolean  (기본 true)
 * - setEnabledOptimistic(next): UI 즉시 반영(낙관적)
 * - revalidate(): 서버값 재검증
 * - mutateGlobal(next?): 어디서든 같은 KEY를 가진 컴포넌트 동기화
 */
export function useGlobalNotify() {
  const { data, isLoading, mutate } = useSWR<{ enabled: boolean }>(
    KEY,
    fetcher,
    { fallbackData: { enabled: true } }
  );

  return {
    enabled: data?.enabled ?? true,
    loading: isLoading,

    setEnabledOptimistic: (next: boolean) =>
      mutate({ enabled: next }, { revalidate: false }),

    revalidate: () => mutate(),

    mutateGlobal: (next?: boolean) =>
      next === undefined
        ? globalMutate(KEY)
        : globalMutate(KEY, { enabled: next }, false),
  };
}
