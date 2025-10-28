export type StepId =
  | "new"
  | "card"
  | "intake"
  | "edit"
  | "calendar"
  | "settings";

export const STEPS = [
  { id: "new", title: "1. 새로운 약 등록", href: "/guide?step=new" },
  { id: "card", title: "2. 약 정보 확인", href: "/guide?step=card" },
  { id: "intake", title: "3. 복용 기록 남기기", href: "/guide?step=intake" },
  { id: "edit", title: "4. 약 정보 수정", href: "/guide?step=edit" },
  { id: "calendar", title: "5. 지난 기록 보기", href: "/guide?step=calendar" },
  { id: "settings", title: "6. 사용자 설정", href: "/guide?step=settings" },
] as const satisfies ReadonlyArray<{ id: StepId; title: string; href: string }>;

export const FIRST_IMAGE: Record<StepId, string> = {
  new: "01.webp",
  card: "01.webp",
  intake: "01.webp",
  edit: "01.webp",
  calendar: "02.webp",
  settings: "01.webp",
};

// (선택) 같은 스텝의 후속 이미지들 – 필요 최소만
export const SEQUENCE: Record<StepId, string[]> = {
  new: ["02.webp", "03.webp", "04.webp"],
  card: ["02.webp", "03.webp", "04.webp"],
  intake: ["02.webp", "03.webp", "04.webp"],
  edit: ["02.webp", "03.webp", "04.webp"],
  calendar: ["03.webp", "01.webp", "04.webp"],
  settings: ["02.webp", "03.webp", "04.webp"],
};
