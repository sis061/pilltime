/** 약 상세 */
export interface MedicineDetail {
  id: number;
  name: string;
  description: string[]; // 문자열 배열로 저장된 약 정보
  imageUrl: string;
  created_at?: string; // ISO 8601 timestamp
  schedules: MedicineSchedule[];
}

/** 스케줄 정보 */
export interface MedicineSchedule {
  id: number;
  time: string; // "HH:MM:SS" 형식
  is_notify: boolean;
  repeated_pattern: RepeatedPattern;
  intake_logs: IntakeLog[];
}

export interface UISchedule {
  id: number | null;
  time: string;
  repeated_pattern: RepeatedPattern;
}

/** 반복 패턴 (JSONB) */
export interface RepeatedPattern {
  tz: string; // 예: "Asia/Seoul"
  type: "DAILY" | "WEEKLY" | "MONTHLY";
  days_of_week: number[]; // WEEKLY 시 요일 인덱스 (0=일~6=토)
  days_of_month: number[]; // MONTHLY 시 일자 배열 (1~31)
}

/** 복용 로그 */
export interface IntakeLog {
  id: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM:SS
  status: "scheduled" | "taken" | "skipped" | "missed";
  checked_at: string | null; // 복용 시각 (없으면 null)
}
