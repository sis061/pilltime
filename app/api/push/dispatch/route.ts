// app/api/push/dispatch/route.ts
// ✅ 중요: web-push는 Node 런타임이 필요
export const runtime = "nodejs";

import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

/** ENV (서버 전용) */
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const CRON_SECRET = process.env.CRON_SECRET!;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT!;
const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY!;

/** web-push 초기화 */
webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

/** Supabase 서비스 클라이언트 (서버 키 사용) */
const sb = createClient(SUPABASE_URL, SERVICE_KEY);

/** 도우미: KST now, date/time 문자열 */
function nowKST() {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" })
  );
}
function pad(n: number) {
  return String(n).padStart(2, "0");
}
function asDate(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function asTime(d: Date) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
}

export async function POST(req: Request) {
  // 1) 간단한 헤더 검증(크론만 접근)
  if (req.headers.get("x-cron-secret") !== CRON_SECRET) {
    return new Response("Forbidden", { status: 403 });
  }

  // 2) 정시 윈도우: [now, now+1m)
  const base = nowKST();
  const to = new Date(base.getTime() + 60 * 1000);
  const p_from_date = asDate(base);
  const p_to_date = asDate(to);
  const p_from_time = asTime(base);
  const p_to_time = asTime(to);

  const { data: onTime, error: e1 } = await sb.rpc(
    "pilltime_fetch_due_on_time",
    {
      p_from_date,
      p_to_date,
      p_from_time,
      p_to_time,
    }
  );
  if (e1)
    return new Response(`on_time rpc error: ${e1.message}`, { status: 500 });

  // 3) 리마인더 윈도우: 방금 missed로 바뀐 로그들만 (Δ = 90s)
  const deltaMs = 90 * 1000;
  const fromTs = new Date(base.getTime() - deltaMs).toISOString();
  const toTs = base.toISOString();
  const { data: reminder, error: e2 } = await sb.rpc(
    "pilltime_fetch_due_reminder_missed",
    {
      p_from_ts: fromTs,
      p_to_ts: toTs,
    }
  );
  if (e2)
    return new Response(`reminder rpc error: ${e2.message}`, { status: 500 });

  // 4) 대상 사용자들의 구독 조회
  const targets = [...(onTime || []), ...(reminder || [])];
  const userIds = [...new Set(targets.map((l: any) => l.user_id))];
  let subsByUser = new Map<string, any[]>();

  if (userIds.length) {
    const { data: subs, error: subErr } = await sb
      .from("push_subscriptions")
      .select("user_id, endpoint, p256dh, auth")
      .in("user_id", userIds);
    if (subErr)
      return new Response(`subs error: ${subErr.message}`, { status: 500 });

    (subs || []).forEach((s) => {
      const arr = subsByUser.get(s.user_id) || [];
      arr.push(s);
      subsByUser.set(s.user_id, arr);
    });
  }

  // 5) 발송 + outbox 기록
  async function sendAndLog(kind: "on_time" | "reminder", rows: any[]) {
    for (const log of rows) {
      const subs = subsByUser.get(log.user_id) || [];
      if (subs.length === 0) continue;

      const title =
        kind === "on_time"
          ? `💊 약 먹을 시간! - ${log.medicine_name ?? ""}`
          : `⚠️ 아 맞다 약!! - ${log.medicine_name ?? ""}`;
      const body =
        kind === "on_time"
          ? "약을 먹은 후 꼭 기록해 주세요."
          : "기록이 없어 리마인드 드려요. 꼭 챙겨드세요.";

      const payload = {
        title,
        body,
        tag: `intake-${log.id}-${kind}`,
        renotify: false,
        requireInteraction: false,
        data: { log_id: log.id, url: `/` },
      };

      // 병렬 발송
      await Promise.all(
        subs.map(async (s) => {
          try {
            await webpush.sendNotification(
              {
                endpoint: s.endpoint,
                keys: { auth: s.auth, p256dh: s.p256dh },
              } as any,
              JSON.stringify(payload)
            );
          } catch (err: any) {
            // 만료된 구독 정리(410/404)
            const msg = String(err?.message || err);
            if (msg.includes("410") || msg.includes("404")) {
              await sb
                .from("push_subscriptions")
                .delete()
                .eq("endpoint", s.endpoint);
            }
          }
        })
      );

      // 중복 방지 기록
      await sb.from("notification_dispatches").insert({ log_id: log.id, kind });
    }
  }

  await sendAndLog("on_time", onTime || []);
  await sendAndLog("reminder", reminder || []);

  return new Response("OK", { status: 200 });
}
