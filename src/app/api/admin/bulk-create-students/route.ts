import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function generatePassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < 10; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}
function slugPart(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.|\.$/g, "") || "student";
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "غير مسجل الدخول" }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "الأدمن فقط يقدر ينشئ دفعة حسابات" }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const count = Math.min(100, Math.max(1, Number(body.count) || 30));
  const grade = String(body.grade || "Grade 4").trim();
  const groupName = String(body.groupName || "Grade 4 - Class A").trim();
  const prefix = String(body.namePrefix || "طالب الصف الرابع").trim();
  const emailDomain = String(body.emailDomain || "ather.local").trim().toLowerCase();
  const admin = createAdminClient();
  const credentials: { name: string; email: string; password: string }[] = [];
  const errors: string[] = [];
  const createdIds: string[] = [];

  for (let i = 1; i <= count; i++) {
    const name = `${prefix} ${String(i).padStart(2, "0")}`;
    const email = `${slugPart(prefix)}.${i}@${emailDomain}`;
    const password = generatePassword();
    const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: name, role: "student", grade } });
    if (error || !data.user) { errors.push(`${email}: ${error?.message ?? "تعذر إنشاء الحساب"}`); continue; }
    createdIds.push(data.user.id);
    credentials.push({ name, email, password });
    await admin.from("profiles").update({ onboarding_completed: false, grade }).eq("id", data.user.id);
  }

  let groupId: string | null = null;
  if (createdIds.length) {
    const { data: existing } = await admin.from("account_groups").select("id").eq("name", groupName).eq("grade", grade).maybeSingle();
    if (existing?.id) groupId = existing.id;
    else {
      const { data: group } = await admin.from("account_groups").insert({ name: groupName, grade }).select("id").single();
      groupId = group?.id ?? null;
    }
    if (groupId) {
      const { error } = await admin.from("account_group_members").upsert(createdIds.map((user_id) => ({ group_id: groupId, user_id })), { onConflict: "group_id,user_id", ignoreDuplicates: true });
      if (error) errors.push(`تعذر ربط الحسابات بالفصل: ${error.message}`);
    }
  }
  return NextResponse.json({ count: credentials.length, requested: count, groupId, credentials, errors });
}
