"use client";

import { useEffect, useState, useTransition } from "react";
// ---- NEXT
import { useRouter } from "next/navigation";
// ---- CUSTOM HOOKS
import { useGlobalNotify } from "@/lib/useGlobalNotify";
// ---- COMPONENT
import ProfileDrawer from "./ProfileDrawer";
import { SmartButtonGroup } from "./SmartButtons";
import NicknameDrawer from "@/components/feature/profiles/NicknameDrawer";
import ProfileBadge from "@/components/feature/profiles/ProfileBadge";
// ---- UI
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
import { useSSRMediaquery } from "@/lib/useSSRMediaquery";
// ---- TYPE
import type { User } from "@/types/profile";
import { toast } from "sonner";

export default function HeaderClient({
  user,
  initialGlobalEnabled,
}: {
  user: User;
  initialGlobalEnabled: boolean;
}) {
  // ---- REACT
  const [openNickname, setOpenNickname] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  /** 🔔 전역 알림 토글 상태 + 낙관적 업데이트 */
  const [globalOn, setGlobalOn] = useState<boolean>(initialGlobalEnabled);
  const [pendingGlobal, startTransition] = useTransition();
  // ---- NEXT
  const router = useRouter();
  // ---- CUSTOM HOOKS
  const isMobile = useSSRMediaquery(640);
  const { setEnabledOptimistic, mutateGlobal } = useGlobalNotify();
  // ---- STORE
  const setUser = useUserStore((s) => s.setUser);
  const clearUser = useUserStore((s) => s.clearUser);
  const setGLoading = useGlobalLoading((s) => s.setGLoading);

  // 오늘 날짜 계산
  // const today = new Date();
  // const y = today.getFullYear();
  // const m = String(today.getMonth() + 1).padStart(2, "0");
  // const d = String(today.getDate()).padStart(2, "0");

  /* ------
   * CONST
   * ------ */

  const todayYmd = toYYYYMMDD(new Date(), "Asia/Seoul");

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
        setGLoading(true, "정보를 불러오는 중이에요..");
      },
    },
    {
      key: "global",
      label: globalOn ? "모든 알림 켜짐" : "모든 알림 꺼짐",
      iconColor: "#fff",
      iconLeft: globalOn ? Bell : BellOff,
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
    setGLoading(true, "정보를 불러오는 중이에요..");
  }

  function toggleGlobal() {
    const next = !globalOn;
    const prev = globalOn;
    const enableContent = prev === true ? "껐어요" : "켰어요!";
    setGlobalOn(next); // 낙관적
    setEnabledOptimistic(next);
    startTransition(async () => {
      try {
        const res = await fetch("/api/push/global", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ enabled: next }),
        });
        if (!res.ok) throw new Error(String(res.status));
        toast.info(`전체 알림을 ${enableContent}`);
        mutateGlobal();
      } catch (e) {
        console.error("[global notify] toggle fail", e);
        // 롤백
        setGlobalOn(prev);
        setEnabledOptimistic(prev);
      }
    });
  }

  useEffect(() => {
    if (user) {
      setUser({ id: user.id, email: user.email, nickname: user.nickname });
    } else {
      clearUser();
    }
  }, [user.id, user.email, user.nickname, setUser, clearUser]);

  if (!isMobile)
    return (
      <div className="flex items-center gap-2">
        <ProfileBadge initialUser={user} />
        <Button
          variant="ghost"
          size="icon-lg"
          onClick={() => setMenuOpen(true)}
          className="!text-white !p-2 flex-col text-xs [&_svg:not([class*='size-'])]:size-6"
        >
          <Menu color="#fff" />
        </Button>
        <ProfileDrawer
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
    );

  return (
    <div className="flex items-center gap-2 h-full">
      {/* 드롭다운 */}
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
          className="border-1 bg-white *:text-[16px] !border-pilltime-violet shadow-lg"
        >
          {menuBtns.map(
            ({ key, label, iconLeft: Icon, onClick, className }) => (
              <DropdownMenuItem
                key={key}
                onSelect={(e) => {
                  e.preventDefault();
                  onClick?.();
                }}
                className={`hover:!bg-pilltime-violet/15 ${className}`}
              >
                {Icon ? (
                  <Icon className="!mr-2 h-5 w-5" color="#3B82F6" />
                ) : null}
                {label}
              </DropdownMenuItem>
            )
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {/* 상단 버튼 그룹 */}
      <SmartButtonGroup items={desktopBtns} />

      <NicknameDrawer
        open={openNickname}
        onOpenChange={setOpenNickname}
        mode="edit"
      />
    </div>
  );
}
