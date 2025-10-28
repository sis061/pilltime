"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import NicknameDrawer from "@/components/feature/profiles/NicknameDrawer";
import dynamic from "next/dynamic";

const FirstVisitBanner = dynamic(() => import("./FirstVisitBanner"), {
  ssr: false,
  loading: () => null,
});

const GuideBanner = dynamic(
  () => import("./GuideBanner").then((m) => m.GuideBanner),
  { ssr: false, loading: () => null }
);

import { useUserStore } from "@/store/useUserStore";

/** 온보딩 전체 순서:
 * 1) 닉네임 없으면 NicknameDrawer(create) -> 완료 후 2로
 * 2) 알림 배너(허용 or 나중에) -> 완료 후 3으로
 * 3) 가이드 배너 -> 끝
 */

export function OnboardingManager() {
  const user = useUserStore((s) => s.user);
  const [openNickname, setOpenNickname] = useState(false);
  const [showNotiBanner, setShowNotiBanner] = useState(false);
  const [showGuideBanner, setShowGuideBanner] = useState(false);
  const startedRef = useRef(false);

  // 환경 체크
  const permission =
    typeof window !== "undefined" ? Notification?.permission : "default";
  const notiPrompted =
    typeof window !== "undefined"
      ? localStorage.getItem("pt:notiPrompted")
      : "1";
  const guidePrompted =
    typeof window !== "undefined"
      ? localStorage.getItem("pt:guidePrompted")
      : "1";

  const needNickname = useMemo(
    () => Boolean(user && user.nickname === null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user?.id, user?.nickname]
  );
  const needNoti = useMemo(
    () => Boolean(user && permission !== "granted" && !notiPrompted),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user?.id, permission, notiPrompted]
  );
  const needGuide = useMemo(
    () => Boolean(user && permission !== "granted" && !guidePrompted),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user?.id, permission, guidePrompted]
  );

  // 최초 진입 분기
  useEffect(() => {
    if (!user || startedRef.current) return;
    startedRef.current = true;

    if (needNickname) {
      setOpenNickname(true);
      return;
    }
    // 닉네임 이미 있으면 바로 2단계 판단
    if (needNoti) {
      // 약간의 딜레이로 자연스러움
      setTimeout(() => setShowNotiBanner(true), 300);
      return;
    }
    if (needGuide) {
      // 알림도 끝난 상태면 가이드로
      setTimeout(() => setShowGuideBanner(true), 500);
    }
  }, [user, needNickname, needNoti, needGuide]);

  // 1단계 완료 → 2단계로
  const handleNicknameCompleted = () => {
    setOpenNickname(false);
    if (needNoti) {
      setTimeout(() => setShowNotiBanner(true), 200);
    } else {
      setTimeout(() => setShowGuideBanner(true), 400);
    }
  };

  // 2단계 완료 → 3단계로
  const handleNotiCompleted = () => {
    setShowNotiBanner(false);
    setTimeout(() => setShowGuideBanner(true), 200);
  };

  // 3단계 완료 → 종료
  const handleGuideCompleted = () => {
    setShowGuideBanner(false);
  };

  return (
    <>
      {/* 1) 닉네임 드로어 */}
      <NicknameDrawer
        open={openNickname}
        onOpenChange={setOpenNickname}
        mode={needNickname ? "create" : "edit"}
        onCompleted={handleNicknameCompleted}
      />

      {/* 2) 알림 배너 (닉네임 완료 후에만 마운트) */}
      {showNotiBanner && <FirstVisitBanner onCompleted={handleNotiCompleted} />}

      {/* 3) 가이드 배너 */}
      {showGuideBanner && <GuideBanner onCompleted={handleGuideCompleted} />}
    </>
  );
}
