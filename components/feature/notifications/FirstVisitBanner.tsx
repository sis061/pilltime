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
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { usePush } from "@/lib/usePush"; // ✅ 경로 업데이트 반영
import { Button } from "@/components/ui/button";
import { BellRing } from "lucide-react";

export default function FirstVisitBanner() {
  const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
  const { permission, subscribe, loading } = usePush(vapid);

  const [open, setOpen] = useState(false);

  // iOS Safari 감지 (대략적)
  const isIOS = useMemo(
    () =>
      typeof window !== "undefined" &&
      /iPad|iPhone|iPod/.test(navigator.userAgent),
    []
  );
  const isSafari = useMemo(
    () =>
      typeof window !== "undefined" &&
      /^((?!chrome|android).)*safari/i.test(navigator.userAgent),
    []
  );

  useEffect(() => {
    // 이미 허용이면 X, 한 번 본 적 있으면 X
    const prompted =
      typeof window !== "undefined" && localStorage.getItem("pt:notiPrompted");
    if (permission !== "granted" && !prompted) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [permission]);

  const handleEnable = async () => {
    try {
      await subscribe(); // 권한 요청 → SW ready → 구독 저장
    } finally {
      localStorage.setItem("pt:notiPrompted", "1");
      setOpen(false);
    }
  };

  const handleLater = () => {
    localStorage.setItem("pt:notiPrompted", "1");
    setOpen(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      {/* AlertDialogTrigger는 자동 팝업이라 필요 없음 */}

      <AlertDialogContent className="sm:max-w-[480px] !bg-pilltime-grayLight !p-4 !rounded-lg">
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <BellRing size={20} color="#3B82F6" />
            <AlertDialogTitle className="!text-pilltime-grayDark/90">
              알림을 허용해주세요!
            </AlertDialogTitle>
          </div>
          <div className="!space-y-3 !py-4 sm:!pl-4 !bg-pilltime-grayLight">
            <div className="[&_p]:!text-pilltime-grayDark/50 !space-y-1">
              <p>
                <strong className="font-bold ">아맞다약!</strong> 은{" "}
                <strong className="!text-pilltime-blue">정시 알림</strong>을
                먼저 보내드린 후
              </p>
              <p>
                <strong className="!text-red-600">30분</strong>이 지나도 먹지
                않으면 <strong className="!text-red-600">다시 알림</strong>을
                보내드려요!
              </p>
              <p className="!pt-2">
                <strong className="!text-pilltime-violet">알림 켜기</strong>{" "}
                버튼을 눌러 꼭 알림을 허용해주세요.
              </p>
            </div>

            {permission === "denied" ? (
              <p className="!text-red-600">
                * 현재 알림이 차단되어 있어요. 브라우저 주소창의 사이트 설정에서
                <strong className="!text-pilltime-violet"> 알림 허용</strong>
                으로 변경한 뒤 다시 시도해 주세요.
              </p>
            ) : null}

            {isIOS && isSafari ? (
              <p className="!text-pilltime-grayDark/75">
                * iOS Safari에서는{" "}
                <strong className="!text-pilltime-violet">
                  홈 화면에 추가(PWA 설치)
                </strong>{" "}
                후에만 알림이 동작합니다. 설치 후 다시 시도해 주세요.
              </p>
            ) : null}
          </div>
        </AlertDialogHeader>

        <AlertDialogFooter className="flex gap-2 !px-12 sm:!px-0">
          <AlertDialogCancel className="!py-2 !px-4" onClick={handleLater}>
            나중에
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleEnable}
            disabled={loading || permission === "denied"}
            className="!py-2 !px-4 !bg-pilltime-blue !text-white"
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
