"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { BookOpen } from "lucide-react";
import { usePlatformInfo } from "@/hooks/usePlatformInfo";

export function GuideBanner({ onCompleted }: { onCompleted?: () => void }) {
  const [open, setOpen] = useState(true);
  const router = useRouter();

  const { isIOS, isSafari, isStandalone } = usePlatformInfo();

  useEffect(() => {
    const seen = localStorage.getItem("pt:guidePrompted");
    if (seen) setOpen(false);
  }, []);

  const finish = () => {
    localStorage.setItem("pt:guidePrompted", "1");
    setOpen(false);
    onCompleted?.();
    if (isStandalone || (isIOS && isSafari)) {
      queueMicrotask(() => window.location.reload());
    }
  };

  const goToGuide = () => {
    router.push("/guide?step=new");
    finish();
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent className="sm:max-w-[480px] !bg-pilltime-grayLight !p-4 !rounded-lg">
        <AlertDialogHeader className="flex items-center gap-2 w-full justify-center">
          <AlertDialogTitle className="!text-pilltime-grayDark/90" hidden>
            거의 다 왔어요!
          </AlertDialogTitle>
          <div className="!space-y-3 !py-4 !bg-pilltime-grayLight sm:!pl-2">
            <div className="[&_p]:!text-pilltime-grayDark/50 !space-y-1">
              <p>
                거의 다 왔어요! 처음 사용이시라면, <br />
                <BookOpen size={20} className="inline-block" />{" "}
                <strong>사용 가이드</strong> 에서 한눈에 배워보세요!
              </p>
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex gap-2 !px-12 sm:!px-0">
          <AlertDialogCancel
            onClick={finish}
            className="!py-2 !px-4 border-0 shadow-sm transition-transform duration-200 ease-in-out scale-100 cursor-pointer touch-manipulation active:scale-95 hover:scale-110"
          >
            닫기
          </AlertDialogCancel>

          <AlertDialogAction
            onClick={goToGuide}
            className="!py-2 !px-4 shadow-sm !bg-pilltime-blue !text-white transition-transform duration-200 ease-in-out scale-100 cursor-pointer touch-manipulation active:scale-95 hover:scale-110"
          >
            가이드 보기
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
