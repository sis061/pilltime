"use client";

import { useEffect, useRef, useState } from "react";
import NicknameDrawer from "@/components/feature/profiles/NicknameDrawer";
import { useUserStore } from "@/store/useUserStore";
import { User } from "@/types/profile";

export default function HomeProfile({ initialUser }: { initialUser: User }) {
  const { user, setUser } = useUserStore();
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
    <div className="!mb-12 flex flex-col items-center gap-4 justify-center max-md:!pt-4">
      <div className="flex items-center justify-center md:justify-end w-full [&_*]:!text-pilltime-grayDark/50">
        <div className=" flex gap-2 items-center md:items-end justify-center [&_h3]:!text-lg [&_span]:!text-[16px] [&_span]:opacity-75">
          <h3>
            {new Date().getMonth() + 1}
            <span>월</span> {new Date().getDate()}
            <span>일</span>
          </h3>
          <h3>
            {new Date().toLocaleDateString("ko-KR", { weekday: "short" })}
            <span>요일</span>
          </h3>
        </div>
      </div>
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
    </div>
  );
}
