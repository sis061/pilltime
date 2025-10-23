// app/api/push/dispatch/route.ts
// ✅ Netlify에서도 Node 런타임 강제
export const runtime = "nodejs";
// ✅ 캐시 회피(혹시 모를 Revalidate 이슈 예방)
export const dynamic = "force-dynamic";

import webpush from "web-push";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/** ENV (서버 전용) */
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const CRON_SECRET = (process.env.CRON_SECRET || "").trim();
const VAPID_SUBJECT = process.env.VAPID_SUBJECT!;
const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY!;

/** 초기화(런타임 최초 1회) */
webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
const sb = createClient(SUPABASE_URL, SERVICE_KEY);

/** 유틸 */
function nowKST() {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" })
  );
}
const pad = (n: number) => String(n).padStart(2, "0");
const asDate = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const asTime = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}:00`;

// ✅ 헤더 시크릿 안전 추출(트림/대소문자 무관)
function readCronSecret(req: Request) {
  // Web Headers는 키 대소문자 무시하지만, 안전하게 두 번 시도
  const raw =
    req.headers.get("x-cron-secret") ?? req.headers.get("X-Cron-Secret") ?? "";
  return raw.trim();
}

export async function POST(req: Request) {
  // 0) 서버 설정 누락 방지
  if (!CRON_SECRET) {
    // 배포/운영 보안: 상세 사유는 숨김
    return NextResponse.json(
      { ok: false, reason: "server_misconfigured" },
      { status: 500 }
    );
  }

  // 1) 시크릿 검증
  const headerSecret = readCronSecret(req);
  if (!headerSecret) {
    return NextResponse.json(
      { ok: false, reason: "forbidden:no_header" },
      { status: 403 }
    );
  }
  if (headerSecret !== CRON_SECRET) {
    // 디버그 도움용(민감정보 노출 금지): 길이만 비교
    return NextResponse.json(
      {
        ok: false,
        reason: "forbidden:mismatch",
        hdr_len: headerSecret.length,
        env_len: CRON_SECRET.length,
      },
      { status: 403 }
    );
  }

  try {
    // 2) 윈도우 계산
    const base = nowKST();
    const to = new Date(base.getTime() + 60 * 1000);
    const p_from_date = asDate(base);
    const p_to_date = asDate(to);
    const p_from_time = asTime(base);
    const p_to_time = asTime(to);

    // 3) 정시 대상
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
      return NextResponse.json(
        { ok: false, reason: "on_time_rpc_error", msg: e1.message },
        { status: 500 }
      );

    // 4) 리마인더 대상(Δ = 5min)
    // const deltaMs = 5 * 60 * 1000;
    // const fromTs = new Date(base.getTime() - deltaMs).toISOString();
    // const toTs = base.toISOString();
    // const { data: reminder, error: e2 } = await sb.rpc(
    //   "pilltime_fetch_due_reminder_missed_v4"
    //   // {
    //   //   p_from_ts: fromTs,
    //   //   p_to_ts: toTs,
    //   // }
    // );
    const { data: reminder, error: e2 } = await sb.rpc(
      "pilltime_fetch_due_reminder_missed_v5"
      // 필요하면 회수 범위 확장:
      // { p_now: new Date().toISOString(), p_max_age: '3 days' }
    );
    if (e2)
      return NextResponse.json(
        { ok: false, reason: "reminder_rpc_error", msg: e2.message },
        { status: 500 }
      );

    // 5) 구독 조회
    const targets = [...(onTime || []), ...(reminder || [])];
    const userIds = [...new Set(targets.map((l: any) => l.user_id))];
    const subsByUser = new Map<string, any[]>();

    if (userIds.length) {
      const { data: subs, error: subErr } = await sb
        .from("push_subscriptions")
        .select("id, user_id, endpoint, p256dh, auth")
        .in("user_id", userIds);
      if (subErr)
        return NextResponse.json(
          { ok: false, reason: "subs_error", msg: subErr.message },
          { status: 500 }
        );

      (subs || []).forEach((s) => {
        const arr = subsByUser.get(s.user_id) || [];
        arr.push(s);
        subsByUser.set(s.user_id, arr);
      });
    }

    // 6) 발송 + 기록
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

        // await Promise.all(
        //   subs.map(async (s) => {
        //     try {
        //       await webpush.sendNotification(
        //         {
        //           endpoint: s.endpoint,
        //           keys: { auth: s.auth, p256dh: s.p256dh },
        //         } as any,
        //         JSON.stringify(payload)
        //       );
        //     } catch (err: any) {
        //       const msg = String(err?.message || err);
        //       if (msg.includes("410") || msg.includes("404")) {
        //         await sb
        //           .from("push_subscriptions")
        //           .delete()
        //           .eq("endpoint", s.endpoint);
        //       }
        //     }
        //   })
        // );

        for (const s of subs) {
          try {
            const res = await webpush.sendNotification(
              {
                endpoint: s.endpoint,
                keys: { auth: s.auth, p256dh: s.p256dh },
              } as any,
              JSON.stringify(payload),
              { TTL: 300 } // 드랍 방지: 5분
            );
            // (선택) 성공 마크
            await sb
              .from("push_subscriptions")
              .update({ updated_at: new Date().toISOString() })
              .eq("id", s.id);
          } catch (e: any) {
            const code = e?.statusCode ?? null;

            // 실패 로그 남기기 (선택)
            await sb.from("push_delivery_logs").insert({
              user_id: log.user_id,
              subscription_id: s.id,
              log_id: log.id,
              status_code: code,
              error: String(e?.body || e?.message),
            });

            // ❗문자열 포함검사 대신 statusCode로 분기
            if (code === 404 || code === 410) {
              // 죽은 구독은 즉시 제거(고아 구독 누적 방지)
              await sb.from("push_subscriptions").delete().eq("id", s.id);
              continue;
            }
            if (code === 401 || code === 403) {
              // VAPID 불일치: 클라 재구독 유도(로그만)
              console.warn("VAPID auth error for sub", s.id, code);
            }
            // 그외는 일단 스킵(다음 구독으로 진행)
            console.warn("push error", s.id, code, e?.body || e?.message);
          }
        }

        try {
          await sb
            .from("notification_dispatches")
            .insert({ log_id: log.id, kind })
            .select()
            .single()
            .throwOnError();
        } catch (e) {
          console.log("dispatch err:", e);
        }
      }
    }

    await sendAndLog("on_time", onTime || []);
    await sendAndLog("reminder", reminder || []);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    // 예외 통합 처리
    return NextResponse.json(
      { ok: false, reason: "unhandled", msg: String(err?.message || err) },
      { status: 500 }
    );
  }
}
