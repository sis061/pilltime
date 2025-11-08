"use client";

import { useEffect, useState, useRef } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { usePush } from "@/hooks/usePush";
import { usePlatformInfo } from "@/hooks/usePlatformInfo";
import { BellRing, Menu } from "lucide-react";
import { useUserStore } from "@/store/useUserStore";

export default function FirstVisitBanner({
  onCompleted,
}: {
  onCompleted?: () => void;
}) {
  const user = useUserStore((s) => s.user);

  // NEXT_PUBLIC_* 은 빌드타임 치환이라 클라에서 사용 OK
  const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
  const { permission, subscribe, loading, refresh } = usePush(vapid);
  const { isIOS, isSafari, isStandalone } = usePlatformInfo();

  const [open, setOpen] = useState(false);

  // --- 열림 조건 판단도 마운트 후에만 수행 (localStorage 접근 포함)
  useEffect(() => {
    if (!user) return;
    if (permission === "granted") {
      setOpen(false);
      return;
    }
    if (typeof window === "undefined") return;

    let prompted: string | null = null;
    try {
      prompted = localStorage.getItem("pt:notiPrompted");
    } catch {
      // 일부 환경(프라이빗 모드 등)에서 예외 가능 → 없다고 간주
      prompted = null;
    }
    // 권한 미허용 + 아직 안내 본 적 없으면 open
    setOpen(!prompted);
  }, [user, permission]);

  const finish = () => {
    try {
      localStorage.setItem("pt:notiPrompted", "1");
    } catch {}
    setOpen(false);
    onCompleted?.();
  };

  const handleEnable = async () => {
    try {
      await subscribe(); // 권한 요청 → SW ready → 구독 저장
      await refresh(); // 즉시 반영
      if (
        typeof document !== "undefined" &&
        document.visibilityState === "visible"
      ) {
        queueMicrotask(() => refresh());
      }
      // if (isStandalone || (isIOS && isSafari)) {
      //   queueMicrotask(() => window.location.reload());
      // }
    } finally {
      // 성공/실패와 무관하게 이번 세션에선 배너 종료
      finish();
    }
  };

  const handleLater = () => {
    finish();
  };

  return (
    <AlertDialog open={open} onOpenChange={(next) => setOpen(next)}>
      {/* AlertDialogTrigger는 자동 팝업이라 불필요 */}
      <AlertDialogContent className="sm:max-w-[480px] !bg-pilltime-grayLight !p-4 !rounded-lg">
        <AlertDialogHeader>
          <div className="flex items-center gap-2 w-full justify-center">
            <BellRing size={20} color="#3B82F6" />
            <AlertDialogTitle className="!text-pilltime-grayDark/90">
              알림을 허용해주세요!
            </AlertDialogTitle>
          </div>

          <div className="!space-y-3 !py-4 !bg-pilltime-grayLight sm:!pl-2">
            <div className="[&_p]:!text-pilltime-grayDark/50 !space-y-1">
              <p>
                <strong>아맞다약!</strong> 은 정시 알림을 먼저 보내드린 후
                30분이 지나도 먹지 않으면 알림을 다시 보내드려요!
              </p>
              <p className="!pt-2">
                <strong className="!text-pilltime-violet">알림 켜기</strong>{" "}
                버튼을 눌러 꼭 알림을 허용해주세요.
              </p>
            </div>

            {permission === "denied" ? (
              <p className="!text-red-600 !pt-2">
                * 현재 알림이 차단되어 있어요. 브라우저 주소창의 사이트 설정에서
                <strong className="!text-pilltime-violet"> 알림 허용</strong>
                으로 변경한 뒤 다시 시도해 주세요.
              </p>
            ) : null}

            {isIOS && isSafari && !isStandalone ? (
              <p className="!text-pilltime-grayDark/75 !pt-2">
                * iOS Safari에서는{" "}
                <strong className="!text-pilltime-violet">
                  홈 화면에 추가
                </strong>{" "}
                후에만 알림이 동작합니다.{" "}
                <Menu
                  size={18}
                  strokeWidth={2.5}
                  className="inline-block !mb-0.5"
                />{" "}
                <strong>(메뉴) &gt; 가이드</strong>를 따라 다시 시도해 주세요.
              </p>
            ) : null}
          </div>
        </AlertDialogHeader>

        <AlertDialogFooter className="flex gap-2 !px-12 sm:!px-0">
          <AlertDialogCancel
            className="!py-2 !px-4 transition-transform duration-200 ease-in-out scale-100 cursor-pointer touch-manipulation active:scale-95 hover:scale-110"
            onClick={handleLater}
          >
            나중에
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleEnable}
            disabled={loading || permission === "denied"}
            className="!py-2 !px-4 !bg-pilltime-blue !text-white transition-transform duration-200 ease-in-out scale-100 cursor-pointer touch-manipulation active:scale-95 hover:scale-110"
          >
            {permission === "default"
              ? "알림 켜기"
              : permission === "denied"
              ? "차단됨"
              : "완료"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
