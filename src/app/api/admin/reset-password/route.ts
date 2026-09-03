import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !["admin", "teacher"].includes(profile.role)) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });

  const { userId } = await request.json();
  if (!userId || userId === user.id) return NextResponse.json({ error: "حساب غير صالح" }, { status: 400 });
  const { data: target } = await supabase.from("profiles").select("role").eq("id", userId).single();
  if (!target || (profile.role === "teacher" && !["student", "parent"].includes(target.role))) return NextResponse.json({ error: "لا تملك صلاحية تغيير كلمة مرور هذا الحساب" }, { status: 403 });

  const password = `Ather-${crypto.randomUUID().replaceAll("-", "").slice(0, 10)}!`;
  const { error } = await createAdminClient().auth.admin.updateUserById(userId, { password });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ password });
}
