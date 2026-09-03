import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "غير مسجل الدخول" }, { status: 401 });
  const { data: actor } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!["admin", "teacher"].includes(actor?.role ?? "")) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  const { userId, active } = await request.json();
  if (!userId || typeof active !== "boolean" || userId === user.id) return NextResponse.json({ error: "بيانات غير صحيحة" }, { status: 400 });
  const admin = createAdminClient();
  const { data: target } = await admin.from("profiles").select("role").eq("id", userId).single();
  if (!target) return NextResponse.json({ error: "الحساب غير موجود" }, { status: 404 });
  if (actor?.role !== "admin" && !["student", "parent"].includes(target.role)) return NextResponse.json({ error: "المعلم لا يمكنه تعديل هذا الحساب" }, { status: 403 });
  const { error: authError } = await admin.auth.admin.updateUserById(userId, { ban_duration: active ? "none" : "876000h" });
  if (authError) return NextResponse.json({ error: authError.message }, { status: 400 });
  const { error: profileError } = await admin.from("profiles").update({ is_active: active }).eq("id", userId);
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 400 });
  return NextResponse.json({ success: true, active });
}
