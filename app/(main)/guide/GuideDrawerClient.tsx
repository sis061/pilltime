"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
// ---- UI
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, List } from "lucide-react";
// ---- UTIL
import { FIRST_IMAGE, SEQUENCE, STEPS, type StepId } from "@/lib/guideImages";
import { warmOptimizer, guidePath } from "@/lib/imageWarm";
import { STEP_CONTENT } from "./guideContent";
// ---- STORE
import { useGlobalLoading } from "@/store/useGlobalLoading";
import { useSSRMediaquery } from "@/hooks/useSSRMediaquery";

type StepMeta = (typeof STEPS)[number];

export default function GuideDrawerClient() {
  const router = useRouter();
  const pathname = usePathname();
  const q = useSearchParams();

  const step = q.get("step") as StepId | null;
  const open = !!step;

  const minTablet = useSSRMediaquery(768);
  const { startLoading } = useGlobalLoading();

  // 현재 스텝 인덱스 계산
  const idx = useMemo(
    () => (step ? STEPS.findIndex((s) => s.id === step) : -1),
    [step]
  );
  const prev = idx > 0 ? STEPS[idx - 1] : null;
  const next = idx >= 0 && idx < STEPS.length - 1 ? STEPS[idx + 1] : null;
  const Content = step ? STEP_CONTENT[step] : null;

  // 드로어 내부 스크롤 컨테이너/제목 ref
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const titleRef = useRef<HTMLHeadingElement | null>(null);

  /* ---------------------------
   * IMG PREFETCH
   * --------------------------- */

  // 직전/다음 스텝의 대표 이미지 1장을 즉시 프리페치
  useEffect(() => {
    if (!step) return;
    const i = STEPS.findIndex((s) => s.id === step);
    const targets = [STEPS[i - 1], STEPS[i + 1]].filter(
      (t): t is StepMeta => !!t
    );
    targets.forEach((t) => {
      const u = guidePath(t.id as StepId, FIRST_IMAGE[t.id as StepId]);
      // 고 DPI 대응: 작은·중간·큰 width를 미리
      warmOptimizer(u, [384, 640, 828, 1200]);
    });
  }, [step]);

  // "다다음" 스텝 대표 이미지 1장을 idle 타임에 프리페치
  useEffect(() => {
    if (!step) return;
    const i = STEPS.findIndex((s) => s.id === step);
    const next2: StepMeta | undefined = STEPS[i + 2];
    if (!next2) return;

    const id = (window as any).requestIdleCallback?.(
      () => {
        const u = guidePath(
          next2.id as StepId,
          FIRST_IMAGE[next2.id as StepId]
        );
        warmOptimizer(u, [384, 640, 828, 1200]);
      },
      { timeout: 1200 }
    );
    return () => id && (window as any).cancelIdleCallback?.(id);
  }, [step]);

  // 같은 스텝 내 후속 이미지들을 스크롤 근접 시 점진적으로 프리페치
  const onBodyScrollWarm = useCallback(() => {
    if (!step) return;
    (SEQUENCE[step] || []).forEach((f) => {
      const u = guidePath(step, f);
      warmOptimizer(u, [384, 640, 828, 1200]);
    });
  }, [step]);

  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    onBodyScrollWarm(); // 최초 1회
    el.addEventListener("scroll", onBodyScrollWarm, { passive: true });
    return () => el.removeEventListener("scroll", onBodyScrollWarm);
  }, [onBodyScrollWarm]);

  // [이전]/[다음] 버튼 hover/focus 시 해당 스텝 대표 이미지 프리페치
  const warmStep = useCallback((id?: StepId | null) => {
    if (!id) return;
    const u = guidePath(id, FIRST_IMAGE[id]);
    warmOptimizer(u, [384, 640, 828, 1200]);
  }, []);

  // 스텝 변경 시 드로어 내부 스크롤/포커스 초기화
  useEffect(() => {
    if (!open) return;
    bodyRef.current?.scrollTo({
      top: 0,
      behavior: "instant" as ScrollBehavior,
    });
    titleRef.current?.focus();
  }, [open, step]);

  /* ---------------------------
   * FUNC
   * --------------------------- */

  // 쿼리스트링 step 교체
  const goto = (target?: StepId) => {
    const params = new URLSearchParams(q);
    if (!target) return;
    params.set("step", target);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // 드로어 닫기 (step 제거)
  const close = () => {
    const params = new URLSearchParams(q);
    params.delete("step");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // "시작하기" 버튼 동작: 홈으로 살짝 이동 후 new 페이지로
  const openNewDrawer = async () => {
    startLoading("open-medicine-new", "새로운 약을 등록하러 가는중..");
    if (pathname !== "/") {
      router.replace("/", { scroll: false });
      await new Promise((r) => requestAnimationFrame(r));
    }
    router.push("/medicines/new?returnTo=/", { scroll: false });
  };

  /* ---------------------------
   * RENDER
   * --------------------------- */

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
