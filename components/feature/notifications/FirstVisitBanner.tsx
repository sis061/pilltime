"use client";
/**
 * 첫 방문 배너
 * - 권한이 'granted'가 아니고, 로컬스토리지 플래그가 없으면 노출
 * - "알림 켜기"를 누르면 usePush.subscribe() 호출 → 성공/실패 상관없이 한 번 본 것으로 처리
 */
import { useEffect, useMemo, useState } from "react";
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
import { BellRing, Menu } from "lucide-react";
import { useUserStore } from "@/store/useUserStore";

export default function FirstVisitBanner({
  onCompleted,
}: {
  onCompleted?: () => void;
}) {
  const user = useUserStore((s) => s.user);
  const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
  const { permission, subscribe, loading, refresh } = usePush(vapid);

  const [open, setOpen] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isSafari, setIsSafari] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ua = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua));
    setIsSafari(/^((?!chrome|android).)*safari/i.test(ua));
    const standalone =
      (window.matchMedia &&
        window.matchMedia("(display-mode: standalone)").matches) ||
      (navigator as any).standalone === true;
    setIsStandalone(Boolean(standalone));
  }, []);

  useEffect(() => {
    if (!user) return;
    if (permission === "granted") return setOpen(false);
    if (typeof window === "undefined") return;

    const prompted = localStorage.getItem("pt:notiPrompted");
    setOpen(!prompted); // 상태로 반영
  }, [user, permission]);

  const finish = () => {
    localStorage.setItem("pt:notiPrompted", "1");
    setOpen(false);
    onCompleted?.();
  };

  const handleEnable = async () => {
    try {
      await subscribe(); // 권한 요청 → SW ready → 구독 저장
      await refresh(); //  즉시 강제 동기화 (모든 환경에서 확정적으로 반영)
      // 가끔 iOS에서 한 틱 늦을 때 보정
      if (document.visibilityState === "visible") {
        queueMicrotask(() => refresh());
      }
    } finally {
      finish();
    }
  };

  const handleLater = () => {
    finish();
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      {/* AlertDialogTrigger는 자동 팝업이라 필요 없음 */}

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
