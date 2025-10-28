"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, List } from "lucide-react";
import { STEP_CONTENT } from "./guideContent";
import { FIRST_IMAGE, SEQUENCE, STEPS, type StepId } from "@/lib/guideImages";
// import { guidePath } from "@/lib/image";
import { guideUrl, warmImage } from "@/lib/imageWarm";
import { useSSRMediaquery } from "@/hooks/useSSRMediaquery";
import { useGlobalLoading } from "@/store/useGlobalLoading";

const GUIDE_CDN_BASE =
  "https://cxkefmygfdtcwidshaoa.supabase.co/storage/v1/object/public/guide";

export default function GuideDrawerClient() {
  const minTablet = useSSRMediaquery(768);
  const { startLoading } = useGlobalLoading();
  const router = useRouter();
  const pathname = usePathname();
  const q = useSearchParams();
  const step = q.get("step") as StepId | null;
  const open = !!step;

  const idx = useMemo(
    () => (step ? STEPS.findIndex((s) => s.id === step) : -1),
    [step]
  );
  const prev = idx > 0 ? STEPS[idx - 1] : null;
  const next = idx >= 0 && idx < STEPS.length - 1 ? STEPS[idx + 1] : null;
  const Content = step ? STEP_CONTENT[step] : null;

  // 드로어 내부 스크롤 컨테이너
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const titleRef = useRef<HTMLHeadingElement | null>(null);

  // prev/next 대표 1장 즉시 워밍업
  useEffect(() => {
    if (!step) return;
    const idx = STEPS.findIndex((s) => s.id === step);
    const targets = [STEPS[idx - 1], STEPS[idx + 1]].filter(Boolean);
    for (const t of targets as unknown as typeof STEPS) {
      const folder = t.id; // 폴더명이 step id와 동일
      const file = FIRST_IMAGE[t.id as StepId];
      warmImage(guideUrl(GUIDE_CDN_BASE, folder, file));
    }
  }, [step]);

  // 아이들 타임에 "다다음" 대표 1장 워밍업
  useEffect(() => {
    if (!step) return;
    const i = STEPS.findIndex((s) => s.id === step);
    const next2 = STEPS[i + 2];
    if (!next2) return;
    const id = (window as any).requestIdleCallback?.(
      () => {
        warmImage(
          guideUrl(
            GUIDE_CDN_BASE,
            next2.id as StepId,
            FIRST_IMAGE[next2.id as StepId]
          )
        );
      },
      { timeout: 1200 }
    );
    return () => id && (window as any).cancelIdleCallback?.(id);
  }, [step]);

  // 같은 스텝 내 후속 이미지: 본문 컨테이너 근처 가시성 기준 점진 워밍업
  const onBodyScrollWarm = useCallback(() => {
    if (!step || !bodyRef.current) return;
    const files = SEQUENCE[step] || [];
    const top = bodyRef.current.scrollTop;
    const vh = bodyRef.current.clientHeight;
    // 스크롤 상단에서 1.5~2.0뷰포트 이내의 이미지만 워밍업 (과욕 금지)
    const threshold = top + vh * 2;

    // 파일명은 콘텐츠에서 실제 쓰는 순서대로 구성해두는 게 가장 정확
    for (const f of files) {
      const url = guideUrl(GUIDE_CDN_BASE, step, f);
      warmImage(url);
    }
  }, [step]);

  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    // 최초 한 번
    onBodyScrollWarm();
    // 스크롤로 근접 시 추가 예열
    el.addEventListener("scroll", onBodyScrollWarm, { passive: true });
    return () => el.removeEventListener("scroll", onBodyScrollWarm);
  }, [onBodyScrollWarm]);

  // [다음]/[이전] 버튼 hover/focus 시 워밍업
  const warmStep = useCallback((id?: StepId | null) => {
    if (!id) return;
    warmImage(guideUrl(GUIDE_CDN_BASE, id, FIRST_IMAGE[id]));
  }, []);

  // 스텝 변경 시 드로어 내부 스크롤/포커스 초기화
  useEffect(() => {
    if (!open) return;
    // 콘텐츠 상단으로
    if (bodyRef.current)
      bodyRef.current.scrollTo({
        top: 0,
        behavior: "instant" as ScrollBehavior,
      });
    // 제목 포커스
    titleRef.current?.focus();
  }, [open, step]);

  const goto = (target?: StepId) => {
    const params = new URLSearchParams(q);
    if (!target) return;
    params.set("step", target);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const close = () => {
    const params = new URLSearchParams(q);
    params.delete("step");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const openNewDrawer = async () => {
    startLoading("open-medicine-new", "새로운 약을 등록하러 가는중..");

    if (pathname !== "/") {
      router.replace("/", { scroll: false });
      await new Promise((r) => requestAnimationFrame(r));
    }
    router.push("/medicines/new?returnTo=/", { scroll: false });
  };

  return (
    <Drawer
      open={open}
      onOpenChange={(v) => {
        if (!v) close();
      }}
      direction={minTablet ? "right" : "bottom"}
      repositionInputs={false}
    >
      <DrawerContent className="!p-4 bg-slate-100 max-h-[96dvh] min-h-[90dvh] md:max-h-[100dvh] md:w-[480px] md:!ml-auto md:top-0 md:rounded-tr-none md:rounded-bl-[10px]">
        <DrawerHeader className="border-b border-b-pilltime-teal/50 !px-4 !pb-4">
          <DrawerTitle asChild>
            <h4
              ref={titleRef}
              tabIndex={-1}
              className="!text-base font-bold outline-none"
            >
              {idx >= 0 ? `${STEPS[idx].title}` : "가이드"}
            </h4>
          </DrawerTitle>
        </DrawerHeader>

        {/* 본문 */}
        <div
          ref={bodyRef}
          className="max-h-[calc(100dvh-8.5rem)] overflow-y-auto !px-4 !py-4 !pb-12 !space-y-4 md:h-screen min-h-[75dvh]"
        >
          {Content ? (
            <Content />
          ) : (
            <p className="text-sm text-gray-600">스텝을 선택해주세요.</p>
          )}
        </div>

        {/* 하단 내비게이션 */}
        <DrawerFooter>
          <div className="border-t border-t-pilltime-teal/50 !py-3 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={close}
              className="font-bold !text-pilltime-violet flex items-center gap-1 justify-center transition-all duration-200 ease-in-out scale-100 cursor-pointer touch-manipulation active:scale-95 hover:scale-105"
            >
              <List className="h-4 w-4" color="#8b5cf6" /> 목록으로
            </Button>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                disabled={!prev}
                onMouseEnter={() => warmStep(prev?.id)}
                onFocus={() => warmStep(prev?.id)}
                onClick={() => goto(prev?.id)}
                className="font-bold text-sm !text-pilltime-violet transition-transform duration-200 ease-in-out scale-100 cursor-pointer touch-manipulation active:scale-95 hover:scale-105"
              >
                <ChevronLeft
                  className="h-4 w-4"
                  color={prev ? "#8b5cf6" : "#8b5cf650"}
                />{" "}
                이전
              </Button>
              {next ? (
                <Button
                  variant="ghost"
                  onMouseEnter={() => warmStep(next.id)}
                  onFocus={() => warmStep(next.id)}
                  onClick={() => goto(next.id)}
                  className="font-bold text-sm !text-pilltime-violet transition-transform duration-200 ease-in-out scale-100 cursor-pointer touch-manipulation active:scale-95 hover:scale-105"
                >
                  다음 <ChevronRight className="h-4 w-4" color="#8b5cf6" />
                </Button>
              ) : (
                <Button
                  onClick={openNewDrawer}
                  className="font-bold text-sm !text-pilltime-blue transition-transform duration-200 ease-in-out scale-100 cursor-pointer touch-manipulation active:scale-95 hover:scale-105"
                >
                  시작하기 <ChevronRight className="h-4 w-4" color="#3b82f6" />
                </Button>
              )}
            </div>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
