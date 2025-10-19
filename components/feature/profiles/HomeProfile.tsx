"use client";

import { useEffect, useRef, useState } from "react";
import NicknameDrawer from "@/components/feature/profiles/NicknameDrawer";
import { User } from "@/types/profile";
import { useUserStore } from "@/store/useUserStore";
// import { useGlobalLoading } from "@/store/useGlobalLoading";

export default function HomeProfile({ initialUser }: { initialUser: User }) {
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
      <div className="!my-16 !text-sm text-center !text-pilltime-grayDark/50 font-bold">
        <h1>로그인 상태를 불러오는 중입니다...</h1>
      </div>
    );
  }

  return (
    <>
      <h1 className="!text-4xl w-full !px-4 text-center !text-pilltime-grayDark/60">
        안녕하세요{" "}
        {currentUser?.nickname ? (
          <span className="!font-bold !text-pilltime-blue">
            {currentUser.nickname}
          </span>
        ) : (
          "..."
        )}
        님!
      </h1>

      <NicknameDrawer
        open={openDrawer}
        onOpenChange={setOpenDrawer}
        mode={currentUser?.nickname ? "edit" : "create"}
      />
    </>
  );
}
