import { z } from "zod";

export const MedicineSchema = z.object({
  name: z.string().min(1, "이름을 입력해주세요"),
  description: z.array(z.object({ value: z.string() })).optional(),
  repeated_pattern: z
    .object({
      type: z.enum(["DAILY", "WEEKLY", "MONTHLY"], {
        message: "복용 주기를 선택해주세요",
      }),
      days_of_week: z.array(z.number()).optional(),
      days_of_month: z.array(z.number()).optional(),
    })
    .refine(
      (val) => val.type !== "WEEKLY" || (val.days_of_week?.length ?? 0) > 0,
      { message: "요일을 최소 1개 이상 선택해주세요", path: ["days_of_week"] }
    )
    .refine(
      (val) => val.type !== "MONTHLY" || (val.days_of_month?.length ?? 0) > 0,
      { message: "날짜를 최소 1개 이상 선택해주세요", path: ["days_of_month"] }
    ),
  schedules: z
    .array(
      z.object({
        time: z.string().min(1, "빈 복용 시간을 채워주세요"),
      })
    )
    .min(1, "복용 시간을 최소 1개 이상 입력해주세요"),
  imageUrl: z.string().optional(),
  imageFilePath: z.string().optional().nullable(),
});

export type MedicineFormValues = z.infer<typeof MedicineSchema>;
