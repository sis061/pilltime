"use client";

import { useEffect, useRef, useState } from "react";
import NicknameDrawer from "@/components/feature/profiles/NicknameDrawer";
import { User } from "@/types/profile";
import { useUserStore } from "@/store/useUserStore";
// import { useGlobalLoading } from "@/store/useGlobalLoading";

export default function ProfileBadge({ initialUser }: { initialUser: User }) {
  const { user, setUser } = useUserStore();
  // const setGLoading = useGlobalLoading((s) => s.setGLoading);
  const [openDrawer, setOpenDrawer] = useState(false);
  const openedOnceRef = useRef(false);

  useEffect(() => {
    if (initialUser && (!user || user.id !== initialUser.id)) {
      setUser(initialUser);
    }
  }, [initialUser, user, setUser]);

  const currentUser = user ?? initialUser;

  useEffect(() => {
    if (
      currentUser &&
      currentUser.nickname === null &&
      !openedOnceRef.current
    ) {
      // setGLoading(true, "닉네임을 등록하러 가는중....");
      setOpenDrawer(true);
      openedOnceRef.current = true;
    }
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className="bg-pilltime-blue rounded-full flex items-center justify-center !py-2 !px-1.5 shadow-md">
        <span className="!font-bold !text-white text-xs">...</span>
      </div>
    );
  }

  return (
    <>
      <div className="bg-pilltime-blue rounded-full flex items-center justify-center !py-2 !px-1.5 shadow-md">
        <span className="!font-bold !text-white text-xs">
          {currentUser.nickname ? currentUser?.nickname.slice(0, 2) : "..."}
        </span>
      </div>

      <NicknameDrawer
        open={openDrawer}
        onOpenChange={setOpenDrawer}
        mode={currentUser?.nickname ? "edit" : "create"}
      />
    </>
  );
}
