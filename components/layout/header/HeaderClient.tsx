"use client";

import { useEffect, useState, useTransition } from "react";
// ---- NEXT
import { useRouter } from "next/navigation";
// ---- CUSTOM HOOKS
import { useGlobalNotify } from "@/hooks/useGlobalNotify";
// ---- COMPONENT
import NavbarDrawer from "./NavbarDrawer";
import { SmartButtonGroup } from "./SmartButtons";
import NicknameDrawer from "@/components/feature/profiles/NicknameDrawer";
import ProfileBadge from "@/components/feature/profiles/ProfileBadge";
// ---- UI
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Bell,
  BellOff,
  CalendarSearch,
  LogOut,
  Menu,
  Plus,
  UserPen,
} from "lucide-react";
// ---- UTIL
import { toYYYYMMDD } from "@/lib/date";
// ---- STORE
import { useUserStore } from "@/store/useUserStore";
import { useGlobalLoading } from "@/store/useGlobalLoading";
import { useSSRMediaquery } from "@/hooks/useSSRMediaquery";
import { usePush } from "@/hooks/usePush";
// ---- TYPE
import type { User } from "@/types/profile";

export default function HeaderClient({
  user,
  initialGlobalEnabled,
  todayYmd,
}: {
  user: User;
  initialGlobalEnabled: boolean;
  todayYmd: string;
}) {
  // ---- REACT
  const [openNickname, setOpenNickname] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  /** 🔔 전역 알림 토글 상태 + 낙관적 업데이트 */
  const [pendingGlobal, startTransition] = useTransition();
  // ---- NEXT
  const router = useRouter();
  // ---- CUSTOM HOOKS
  const minMobile = useSSRMediaquery(640);
  const { enabled, setEnabledOptimistic, mutateGlobal, revalidate } =
    useGlobalNotify();
  const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
  const { permission, isSubscribed, subscribe, loading, refresh } =
    usePush(vapid);
  // ---- STORE
  const setUser = useUserStore((s) => s.setUser);
  const clearUser = useUserStore((s) => s.clearUser);
  const { startLoading } = useGlobalLoading();

  // 오늘 날짜 계산
  // const today = new Date();
  // const y = today.getFullYear();
  // const m = String(today.getMonth() + 1).padStart(2, "0");
  // const d = String(today.getDate()).padStart(2, "0");

  /* ------
   * CONST
   * ------ */

  const enabledForRender = enabled ?? initialGlobalEnabled;
  const notifyOn = isSubscribed === true && enabledForRender === true;

  /** 공통 버튼 config (props로 내려줄 것) */
  const baseWhiteBtn =
    "group font-bold cursor-pointer [&_*]:!text-white flex-col !text-xs !p-2 flex items-center justify-center h-full [&_svg:not([class*='size-'])]:size-7 [&_svg]:transition-transform [&_svg]:duration-200 [&_svg]:ease-in-out [&_svg]:scale-100 [&_svg]:group-hover:scale-110";
  const baseBlueBtn = (mobile = false) =>
    `font-bold cursor-pointer !text-pilltime-blue [&_*]:!text-pilltime-blue ${
      mobile ? "!text-sm" : "!text-xs"
    } !p-2 flex items-center [&_svg:not([class*='size-'])]:size-5`;

  const desktopBtns = [
    {
      id: "create_new_medicine",
      key: "new",
      label: "새로운 약 등록",
      iconLeft: Plus,
      iconColor: "#fff",
      className: baseWhiteBtn,
      onClick: goNewMedicine,
    },
    {
      key: "calendar",
      label: "지난 기록 보기",
      iconColor: "#fff",
      iconLeft: CalendarSearch,
      className: baseWhiteBtn,
      onClick: () => {
        setMenuOpen(false);
        router.push(`/calendar?d=${todayYmd}`);
        startLoading("open-calendar", "정보를 불러오는 중이에요..");
      },
    },
    {
      key: "global",
      // label: notifyOn ? "모든 알림 켜짐" : "모든 알림 꺼짐",
      label:
        isSubscribed === false
          ? "알림 비활성화됨"
          : enabled === true
          ? "모든 알림 켜짐"
          : "모든 알림 꺼짐",
      iconColor: notifyOn ? "#fff" : "#ffffff75",
      iconLeft: notifyOn ? Bell : BellOff,
      className: baseWhiteBtn,
      onClick: () => !pendingGlobal && toggleGlobal(),
    },
  ];

  const menuBtns = [
    {
      key: "edit",
      label: "프로필 편집",
      iconLeft: UserPen,
      className: baseBlueBtn,
      onClick: () => setOpenNickname(true),
    },
    {
      key: "logout",
      label: "로그아웃",
      iconLeft: LogOut,
      className: baseBlueBtn,
      onClick: logout,
    },
  ];

  // 모바일 드로어용 버튼/메뉴
  const drawerBtns = desktopBtns.map((b) => ({
    ...b,
    iconColor: "#3B82F6",
    className: baseBlueBtn(true),
  }));

  /* ------
   * function
   * ------ */

  async function getSupabase() {
    const { createClient } = await import("@/lib/supabase/client");
    return createClient();
  }

  async function logout() {
    const supabase = await getSupabase();
    await supabase.auth.signOut();
    clearUser();
    router.replace("/login");
  }

  function goNewMedicine() {
    setMenuOpen(false);
    router.push("/medicines/new");
    startLoading("open-medicine-new", "템플릿을 불러오는 중이에요..");
  }

  function toggleGlobal() {
    startTransition(async () => {
      try {
        if (permission === "denied") {
          toast.error(
            "브라우저에서 알림이 차단되어 있어요. 사이트 설정에서 허용으로 바꿔주세요."
          );
          return;
        }

        // (A) 아직 구독이 없다면: 구독을 먼저 생성
        if (!isSubscribed) {
          const ok = await subscribe();
          if (!ok) {
            toast.error("알림 구독에 실패했어요. 잠시 후 다시 시도해 주세요.");
            await refresh();
            return;
          }
          // 구독 성공 → 서버 설정도 켬
          setEnabledOptimistic(true); // SWR 캐시 즉시 on
          const res = await fetch("/api/push/global", {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ enabled: true }),
          });
          if (!res.ok) throw new Error(String(res.status));
          mutateGlobal(true); // 전역 캐시 동기화
          toast.success("모든 알림을 켰어요!");
          await refresh(); // 실제 구독 상태 재동기화
          return;
        }

        // (B) 구독은 있는데 서버 설정만 꺼짐 → 서버만 켬
        if (isSubscribed && !enabled) {
          setEnabledOptimistic(true);
          const res = await fetch("/api/push/global", {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ enabled: true }),
          });
          if (!res.ok) throw new Error(String(res.status));
          mutateGlobal(true);
          toast.success("모든 알림을 켰어요!");
          return;
        }

        // (C) (isSubscribed && enabled) = 완전 켜짐 → 서버만 끔 (구독은 유지)
        setEnabledOptimistic(false);
        const res = await fetch("/api/push/global", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ enabled: false }),
        });
        if (!res.ok) throw new Error(String(res.status));
        mutateGlobal(false);
        toast.info("모든 알림을 껐어요");
      } catch (e) {
        console.error("[global notify] toggle fail", e);
        // 롤백은 SWR 재검증으로 수습
        await revalidate();
      } finally {
        await refresh();
      }
    });
  }

  // async function reconnectPush() {
  //   if (permission === "denied") {
  //     toast.error(
  //       "브라우저에서 알림이 차단되어 있어요. 사이트 설정에서 허용으로 바꿔주세요."
  //     );
  //     return;
  //   }
  //   try {
  //     const reg = await navigator.serviceWorker.ready;
  //     const old = await reg.pushManager.getSubscription();
  //     if (old) {
  //       await fetch("/api/push/unsubscribe", {
  //         method: "POST",
  //         headers: { "content-type": "application/json" },
  //         body: JSON.stringify({ endpoint: old.endpoint }),
  //       }).catch(() => {});
  //       await old.unsubscribe().catch(() => {});
  //     }
  //     const ok = await subscribe(); // ← 새 endpoint 발급 + /api/push/subscribe upsert
  //     if (!ok) throw new Error("resubscribe failed");

  //     // (선택) 서버 전역 알림 ON
  //     await fetch("/api/push/global", {
  //       method: "PATCH",
  //       headers: { "content-type": "application/json" },
  //       body: JSON.stringify({ enabled: true }),
  //     }).catch(() => {});

  //     await refresh();
  //     toast.success("푸시 재연결 완료!");
  //   } catch (e) {
  //     console.error("[reconnectPush] fail", e);
  //     await refresh();
  //     toast.error("푸시 재연결에 실패했어요. 잠시 후 다시 시도해 주세요.");
  //   }
  // }

  useEffect(() => {
    // 클라 마운트 후 서버 스냅샷과 동기화
    if (enabled === undefined) mutateGlobal(initialGlobalEnabled);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialGlobalEnabled]);

  // 초기/권한 변화 시 실제 구독 상태 동기화
  useEffect(() => {
    refresh();
  }, [refresh, permission]);

  useEffect(() => {
    if (user) {
      setUser({ id: user.id, email: user.email, nickname: user.nickname });
    } else {
      clearUser();
    }
  }, [user.id, user.email, user.nickname, setUser, clearUser]);

  /* ------
   * render
   * ------ */

  return (
    <div>
      {/* 모바일 헤더 */}
      <div className="sm:hidden flex items-center gap-2">
        <ProfileBadge initialUser={user} />
        <Button
          variant="ghost"
          size="icon-lg"
          onClick={() => setMenuOpen(true)}
          className="!text-white !p-2 flex-col text-xs [&_svg:not([class*='size-'])]:size-6"
        >
          <Menu color="#fff" />
        </Button>
        <NavbarDrawer
          open={menuOpen}
          onOpenChange={setMenuOpen}
          logout={logout}
          openNickname={() => setOpenNickname(true)}
          buttons={drawerBtns}
          menuButtons={menuBtns}
        />
        <NicknameDrawer
          open={openNickname}
          onOpenChange={setOpenNickname}
          mode="edit"
        />
      </div>

      {/* 태블릿, pc 헤더 */}
      <div className="sm:flex hidden items-center gap-2 h-full">
        {/* 상단 버튼 그룹 */}
        <SmartButtonGroup items={desktopBtns} />
        {/* 프로필 -- 드롭다운 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              // variant="ghost"
              className={`${baseWhiteBtn} rounded-2xl [&_svg:not([class*='size-'])]:size-6 group [&_div]:transition-transform [&_div]:duration-200 [&_div]:ease-in-out [&_div]:scale-100 [&_div]:group-hover:scale-110`}
              aria-haspopup="dialog"
            >
              {/* <UserCog className="h-6 w-6" color="#fff" /> */}
              <ProfileBadge initialUser={user} />
              <span className="!pt-2">프로필 관리</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="bottom"
            align="end"
            className="border-1 bg-white !border-pilltime-violet shadow-lg !w-28 !pl-2"
          >
            {menuBtns.map(
              ({ key, label, iconLeft: Icon, onClick, className }) => (
                <DropdownMenuItem
                  key={key}
                  onSelect={(e) => {
                    e.preventDefault();
                    onClick?.();
                  }}
                  className={`hover:!bg-pilltime-violet/15 !text-sm font-bold !my-1 w-28 ${className}`}
                >
                  {Icon ? <Icon className="h-5 w-5" color="#3B82F6" /> : null}
                  {label}
                </DropdownMenuItem>
              )
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        <NicknameDrawer
          open={openNickname}
          onOpenChange={setOpenNickname}
          mode="edit"
        />
      </div>
    </div>
  );
}
