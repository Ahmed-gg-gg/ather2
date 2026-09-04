import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "غير مسجل الدخول" }, { status: 401 });
  const admin = createAdminClient();
  const { data: actor } = await admin.from("profiles").select("role").eq("id", user.id).single();
  if (actor?.role !== "admin") return NextResponse.json({ error: "الأدمن فقط" }, { status: 403 });
  const { data: teachers, error } = await admin.from("profiles").select("id, full_name, grade").eq("role", "teacher").eq("is_active", true).order("full_name");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ teachers: teachers ?? [] });
}
