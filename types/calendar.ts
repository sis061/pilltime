export type PillStatusServer = "scheduled" | "taken" | "missed" | "skipped";

export type DayDot = {
  medicine_id: number | string; // bigint 호환
  label: string;
  status: PillStatusServer;
};

export type MonthIndicatorMap = Record<string, DayDot[]>;

/** 하루 상세용 아이템 (스키마 반영) */
export type DayIntakeItem = {
  intake_id: string; // bigint → 안전하게 string으로 직렬화
  schedule_id: string; // bigint → string
  medicine_id: string; // bigint → string
  medicine_name: string;
  /** HH:mm (time without time zone -> 문자열 5자리로 변환) */
  time: string;
  status: PillStatusServer;
  /** 선택: 소스(enum). 필요 없으면 지워도 됨 */
  source?: string;
};

export type DayIntakeResponse = {
  date: string; // YYYY-MM-DD
  items: DayIntakeItem[];
};
