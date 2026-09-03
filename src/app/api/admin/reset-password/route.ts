import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const supabase = await createClient();
  const admin = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  // Use the service-role client for role checks as well as the password update.
  // This avoids RLS hiding the actor/target profile in production.
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const actorRole = profile?.role ?? "";
  if (!["admin", "teacher"].includes(actorRole)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const { userId } = await request.json();
  if (!userId || userId === user.id) {
    return NextResponse.json({ error: "حساب غير صالح" }, { status: 400 });
  }

  const { data: target } = await admin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();
  if (!target || (actorRole === "teacher" && !["student", "parent"].includes(target.role))) {
    return NextResponse.json(
      { error: "لا تملك صلاحية تغيير كلمة مرور هذا الحساب" },
      { status: 403 }
    );
  }

  const password = `Ather-${crypto.randomUUID().replaceAll("-", "").slice(0, 10)}!`;
  const { error } = await admin.auth.admin.updateUserById(userId, { password });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ password });
}
