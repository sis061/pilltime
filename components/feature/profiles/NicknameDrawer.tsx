"use client";

import { useState, useEffect, useRef } from "react";

// ---- UI
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

// ---- UTIL
import { createClient } from "@/lib/supabase/client";

// ---- CUSTOM HOOKS
import { useSSRMediaquery } from "@/hooks/useSSRMediaquery";

// ---- STORE
import { useUserStore } from "@/store/useUserStore";
import { useGlobalLoading } from "@/store/useGlobalLoading";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: "create" | "edit"; // 최초 입력 / 수정 모드
  onCompleted?: (mode: "create" | "edit") => void;
}

export default function NicknameDrawer({
  open,
  onOpenChange,
  mode = "edit",
  onCompleted,
}: Props) {
  // ---- UTIL
  const supabase = createClient();

  // ---- STORE
  const user = useUserStore((s) => s.user);
  const setUser = useUserStore((s) => s.setUser);
  const { isGLoading, startLoading, stopLoading, forceStop } =
    useGlobalLoading();

  // ---- REACT
  const [submitting, setSubmitting] = useState(false);
  const [nickname, setNickname] = useState(user?.nickname || "");
  const submitBtnRef = useRef<HTMLButtonElement>(null);
  const modeAtOpenRef = useRef<"create" | "edit">(mode);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // ---- CUSTOM HOOKS
  const minTablet = useSSRMediaquery(768);

  // Drawer가 열릴 때, 그 시점의 모드를 고정(부모 리렌더 영향 차단)
  useEffect(() => {
    if (open) {
      modeAtOpenRef.current = mode;
    }
  }, [open, mode]);

  useEffect(() => {
    if (open) {
      setNickname(user?.nickname || "");
    }
  }, [open, user]);

  /* ---------------------------
   * API
   * --------------------------- */

  // -- 낙관적 업데이트 적용
  async function handleSave() {
    const openedMode = modeAtOpenRef.current;

    if (!user) {
      toast.error("로그인 정보가 없어요. 다시 시도해주세요.");
      return;
    }
    if (submitting || isGLoading) return;

    const prevNickname = user.nickname ?? "";
    const nextNickname = nickname.trim();

    // 0) 빠른 가드
    if (!nextNickname) {
      toast.error("별명을 입력하세요");
      inputRef.current?.focus();
      return;
    }
    if (nextNickname === prevNickname) {
      toast.message("변경 사항이 없어요");
      onOpenChange(false);
      return;
    }

    // 1) 프리플라이트 — 중복만 검사 (스피너/낙관적 업데이트 없음)
    setSubmitting(true);
    const { data: taken, error: rpcErr } = await supabase.rpc(
      "is_nickname_taken",
      {
        nick: nextNickname,
        exclude: user.id,
      }
    );
    if (rpcErr) {
      console.error(rpcErr);
      setSubmitting(false);
      toast.error("중복 확인 중 오류가 발생했어요");
      return;
    }
    if (taken) {
      // 중복 시: 여기서 종료. catch로 흘리지 않음 → 토스트 1번만
      toast.error("이미 사용 중인 별명이에요");
      setSubmitting(false);
      inputRef.current?.focus();
      return;
    }

    // 2) 실제 저장 시작 — 이제 스피너 ON + 낙관적 업데이트
    startLoading(
      "fetch-profile",
      openedMode === "create"
        ? "프로필을 만드는 중이에요..."
        : "프로필을 수정 중이에요..."
    );

    // 낙관적 업데이트
    const optimisticUser = { ...user, nickname: nextNickname };
    setUser(optimisticUser);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ nickname: nextNickname })
        .eq("id", user.id);

      if (error) throw new Error(error.message);

      toast.success(
        openedMode === "create" ? "별명을 등록했어요" : "별명을 수정했어요"
      );
      onOpenChange(false);

      // if (openedMode === "create") {
      //   startLoading("open-medicine-new", "새로운 약을 등록하러 가는중..");
      //   router.push("/medicines/new");
      // }
      stopLoading("fetch-profile");
      onCompleted?.(openedMode);
    } catch (err: any) {
      // 실패 시 롤백
      console.error("별명 업데이트 실패:", err?.message || err);
      toast.error(
        openedMode === "create"
          ? "별명을 등록하는 중 문제가 발생했어요"
          : "별명을 수정하는 중 문제가 발생했어요"
      );
      setUser({ ...user, nickname: prevNickname });
      forceStop();
    } finally {
      setSubmitting(false);
    }
  }

  const busy = isGLoading || submitting;
  const prevNickname = user?.nickname ?? "";
  const nextNickname = nickname.trim();
  const disabled =
    busy || nextNickname.length === 0 || nextNickname === prevNickname;

  return (
    <Drawer
      open={open}
      onOpenChange={(nextOpen) => {
        if (busy && !nextOpen) return;
        onOpenChange(nextOpen);
      }}
      direction={minTablet ? "right" : "bottom"}
      repositionInputs={false}
    >
      <DrawerContent className="!p-4 bg-slate-100 min-h-[70dvh] max-h-[96dvh] md:max-h-[100dvh] md:w-[480px] md:!ml-auto md:top-0 md:rounded-tr-none md:rounded-bl-[10px] !z-[999] ">
        {/* Header */}
        <DrawerHeader className="!pb-4 flex w-full items-center justify-between">
          <Button
            disabled={busy}
            onClick={() => onOpenChange(false)}
            variant={"ghost"}
            className={`!pr-2 font-bold transition-transform duration-200 ease-in-out scale-100 cursor-pointer touch-manipulation active:scale-95 hover:scale-110  ${
              mode === "create" ? `!text-transparent` : `!text-pilltime-violet`
            } `}
          >
            취소
          </Button>
          <DrawerTitle className="text-md">
            {mode === "create" ? "프로필 생성" : "프로필 편집"}
          </DrawerTitle>
          <Button
            type="submit"
            disabled={disabled}
            variant={"ghost"}
            className={`!pl-1 font-bold !text-pilltime-violet transition-transform duration-200 ease-in-out scale-100 cursor-pointer touch-manipulation active:scale-95 hover:scale-110 ${
              disabled ? "opacity-50 cursor-not-allowed" : ""
            }`}
            onClick={() =>
              submitBtnRef?.current && submitBtnRef.current.click()
            }
          >
            저장
          </Button>
        </DrawerHeader>

        {/* Body */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!disabled) handleSave();
          }}
          className="flex flex-col gap-8 max-h-[80vh] md:h-screen overflow-y-auto !px-2 !pb-8"
        >
          <div className="!p-2 flex flex-col gap-4">
            {mode === "create" ? (
              <div className="flex flex-col gap-1 !pl-1 !pb-2">
                <span className="text-sm font-bold !text-pilltime-grayDark/50 ">
                  가입을 환영해요!
                </span>
                <span className="text-sm font-bold !text-pilltime-grayDark/50 ">
                  간단한 별명을 먼저 만들어볼까요?
                </span>
              </div>
            ) : (
              <label className="text-sm font-semibold">별명</label>
            )}

            <Input
              ref={inputRef}
              value={nickname}
              required
              onChange={(e) => setNickname(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !busy) {
                  e.preventDefault();
                  if (!disabled) handleSave();
                }
              }}
              placeholder="별명을 입력하세요"
              className="!px-2 !border-pilltime-grayLight w-[98%] !ml-1 !z-[999]"
            />
          </div>
          <button ref={submitBtnRef} type="submit" className="hidden">
            저장
          </button>
        </form>

        {/* Footer */}
        {/* {mode === "edit" && (
          <DrawerFooter className="flex justify-center !py-8">
            <Button
              type="button"
              variant="destructive"
              className="!text-red-700"
              onClick={() => {
                setNickname("");
                handleSave();
              }}
            >
              별명 초기화
            </Button>
          </DrawerFooter>
        )} */}
      </DrawerContent>
    </Drawer>
  );
}
