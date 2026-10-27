import { NextResponse } from "next/server";

import { createServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const name = typeof user?.user_metadata?.full_name === "string" ? user.user_metadata.full_name : undefined;

  return NextResponse.json(
    user
      ? { user: { id: user.id, name: name ?? user.email?.split("@")[0] ?? "Bibble learner", email: user.email ?? "" } }
      : { user: null },
    { headers: { "Cache-Control": "no-store" } },
  );
}
