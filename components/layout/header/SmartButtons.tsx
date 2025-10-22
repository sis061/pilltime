"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";

/**
 * 재사용 가능한 스마트 버튼
 * - shadcn/ui Button 기반
 * - 아이콘, 라벨, 클릭 핸들러만 다르게 지정
 * - 다른 컴포넌트에서도 import 가능
 */
export interface SmartButtonProps {
  id?: string;
  label: string;
  onClick?: () => void;
  iconLeft?: LucideIcon;
  iconColor: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
  loading?: boolean;
  className?: string;
}

export const SmartButton = React.forwardRef<
  HTMLButtonElement,
  SmartButtonProps
>(
  (
    {
      id = "",
      label,
      onClick,
      iconLeft: Icon,
      // variant = "default",
      loading = false,
      className,
      iconColor = "#fff",
    },
    ref
  ) => {
    return (
      <button
        id={id}
        ref={ref}
        // variant={variant}
        onClick={onClick}
        disabled={loading}
        className={["rounded-2xl", className].join(" ")}
      >
        {Icon ? (
          <Icon size={28} className="max-sm:!mr-4" color={iconColor} />
        ) : null}
        <span className="sm:!pt-3">{loading ? "처리 중…" : label}</span>
      </button>
    );
  }
);
SmartButton.displayName = "SmartButton";

/**
 * 여러 버튼을 배열로 관리하여 간단히 렌더할 수 있는 컴포넌트
 */
export interface SmartButtonGroupItem extends SmartButtonProps {
  key: string;
}

export function SmartButtonGroup({
  items,
  className,
}: {
  items: SmartButtonGroupItem[];
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap gap-4 sm:gap-2 ${className}`}>
      {items.map(({ key, ...rest }) => (
        <SmartButton key={key} {...rest} />
      ))}
    </div>
  );
}
