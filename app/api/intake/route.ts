import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function PUT(req: Request) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user)
    return NextResponse.json({ error: '"Unauthorized' }, { status: 401 });

  const body = await req.json();

  const { data, error } = await supabase
    .from("intake_logs")
    .update({
      status: body.status,
      source: body.source,
      checked_at: body.checked_at,
    })
    .eq("id", Number(body.id))
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
