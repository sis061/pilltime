// components/common/SmartImage.tsx
"use client";

import * as React from "react";
import Image, { type StaticImageData } from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import clsx from "clsx";
import fallbackImg from "@/public/fallback-medicine.webp";

export type SmartImageProps = {
  /** 최종 이미지 URL (string | null). 없거나 빈 문자열이면 fallbackImg 사용 */
  src?: string | StaticImageData | null;
  /** 이미지 대체 텍스트 */
  alt?: string;

  /** fill 모드 (wrapper는 relative 여야 함). true면 width/height는 무시 */
  fill?: boolean;

  /** width/height (fill=false일 때만 사용) */
  width?: number;
  height?: number;

  /** 외곽 div에 줄 클래스 (사이즈/레이아웃 지정 추천: w-40 h-40 등) */
  wrapperClassName?: string;
  /** next/image에 줄 클래스 */
  className?: string;

  /** 클릭 핸들러 (wrapper에 바인딩) */
  onClick?: () => void;

  /** next/image 전달용 옵션들 */
  priority?: boolean;
  loading?: "eager" | "lazy";
  unoptimized?: boolean;

  /** 로딩 중 스켈레톤 표시 여부 (기본 true) */
  showSkeleton?: boolean;

  /**
   * fallbackImg를 사용할 때 next/image의 blur placeholder를 켤지 여부
   * (fallback은 정적 import라 blurDataURL 포함) 기본 true
   */
  placeholderForFallback?: boolean;

  /** 로드 완료/에러 콜백 (선택) */
  onLoad?: () => void;
  onError?: () => void;
};

export default function SmartImage({
  src,
  alt = "image",
  fill = false,
  width = 160,
  height = 160,
  wrapperClassName,
  className,
  onClick,
  priority,
  loading = "lazy",
  unoptimized,
  showSkeleton = true,
  placeholderForFallback = true,
  onLoad,
  onError,
}: SmartImageProps) {
  const hasCustomString = typeof src === "string" && src.trim().length > 0;

  const finalSrc: string | StaticImageData = hasCustomString
    ? (src as string)
    : fallbackImg;

  const isDefault = finalSrc === fallbackImg;

  const [loaded, setLoaded] = React.useState(false);

  // src(최종) 바뀔 때마다 스켈레톤/페이드 리셋
  React.useEffect(() => {
    setLoaded(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasCustomString ? src : "fallback"]); // 의존성 키 고정

  const imageCommonProps = {
    alt,
    className: clsx(
      "object-cover transition-opacity duration-500",
      loaded ? "opacity-100" : "opacity-0",
      className
    ),
    priority,
    loading,
    unoptimized,
    onLoad: () => {
      setLoaded(true);
      onLoad?.();
    },
    onError: () => {
      // 에러여도 스켈레톤 영구 표시 방지
      setLoaded(true);
      onError?.();
    },
  } as const;

  return (
    <div
      className={clsx(
        "relative overflow-hidden rounded-md",
        // fill=false면 고정 크기 제공(레이아웃 점프 방지)
        !fill && "inline-block",
        wrapperClassName
      )}
      style={!fill ? { width, height } : undefined}
      onClick={onClick}
    >
      {/* 스켈레톤: 이미지가 준비되기 전까지 화면을 채움 */}
      {showSkeleton && !loaded && (
        <Skeleton className="absolute inset-0 h-full w-full bg-[#2D383E]" />
      )}

      {/* 실제 이미지 */}
      {fill ? (
        <Image
          src={finalSrc}
          fill
          sizes="(max-width: 768px) 160px, 160px"
          {...imageCommonProps}
          // 폴백일 때만 blur placeholder 사용
          placeholder={isDefault && placeholderForFallback ? "blur" : "empty"}
          blurDataURL={
            isDefault && placeholderForFallback
              ? (fallbackImg as any).blurDataURL
              : undefined
          }
        />
      ) : (
        <Image
          src={finalSrc}
          width={width}
          height={height}
          {...imageCommonProps}
          placeholder={isDefault && placeholderForFallback ? "blur" : "empty"}
          blurDataURL={
            isDefault && placeholderForFallback
              ? (fallbackImg as any).blurDataURL
              : undefined
          }
        />
      )}
    </div>
  );
}
