import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function generatePassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const bytes = new Uint32Array(10);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (value) => chars[value % chars.length]).join("");
}

function generateBatchKey() {
  const bytes = new Uint32Array(2);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (value) => value.toString(36)).join("").slice(0, 8);
}

function slugPart(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.|\.$/g, "") || "student";
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "غير مسجل الدخول" }, { status: 401 });

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "الأدمن فقط يقدر ينشئ دفعة حسابات" }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const count = Math.min(1000, Math.max(1, Number(body.count) || 50));
  const grade = String(body.grade || "الرابع الابتدائي").trim();
  const groupName = String(body.groupName || "الرابع الابتدائي - الفصل A").trim();
  const teacherId = body.teacherId ? String(body.teacherId) : null;
  const prefix = String(body.namePrefix || "طالب الصف الرابع").trim();
  const emailDomain = String(body.emailDomain || "ather.local").trim().toLowerCase();
  const passwordMode = body.passwordMode === "same" ? "same" : "random";
  const sharedPassword = String(body.password || "");

  if (!grade || !groupName || !prefix || !emailDomain || !/^[a-z0-9.-]+$/.test(emailDomain)) return NextResponse.json({ error: "تأكد من الصف والفصل وبادئة الاسم ونطاق البريد" }, { status: 400 });
  if (passwordMode === "same" && sharedPassword.length < 8) return NextResponse.json({ error: "كلمة المرور الموحدة يجب أن تكون 8 أحرف على الأقل" }, { status: 400 });

  if (teacherId) {
    const { data: teacher } = await admin.from("profiles").select("id, role").eq("id", teacherId).single();
    if (teacher?.role !== "teacher") return NextResponse.json({ error: "المعلم المحدد غير صالح" }, { status: 400 });
  }

  const credentials: { name: string; email: string; password: string }[] = [];
  const errors: string[] = [];
  const createdIds: string[] = [];
  const batchKey = generateBatchKey();
  const gradeNumber = Math.max(1, [
    "الأول الابتدائي", "الثاني الابتدائي", "الثالث الابتدائي", "الرابع الابتدائي", "الخامس الابتدائي", "السادس الابتدائي",
    "الأول الإعدادي", "الثاني الإعدادي", "الثالث الإعدادي", "الأول الثانوي", "الثاني الثانوي", "الثالث الثانوي",
  ].indexOf(grade) + 1);
  const classMatch = groupName.match(/الفصل\s+([A-F])$/i);
  const classPart = classMatch?.[1]?.toLowerCase() || "x";
  const jobs = Array.from({ length: count }, (_, index) => index + 1);
  const chunkSize = 20;

  for (let start = 0; start < jobs.length; start += chunkSize) {
    const chunk = jobs.slice(start, start + chunkSize);
    const results = await Promise.all(chunk.map(async (i) => {
      const name = `${prefix} ${String(i).padStart(2, "0")}`;
      const email = `${slugPart(prefix)}.g${gradeNumber}.${classPart}.${batchKey}.${String(i).padStart(3, "0")}@${emailDomain}`;
      const password = passwordMode === "same" ? sharedPassword : generatePassword();
      const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: name, role: "student", grade } });
      return { name, email, password, data, error };
    }));
    for (const result of results) {
      const { data, error, email, name, password } = result;
      if (error || !data.user) { errors.push(`${email}: ${error?.message ?? "تعذر إنشاء الحساب"}`); continue; }
      createdIds.push(data.user.id);
      credentials.push({ name, email, password });
      const { error: profileError } = await admin.from("profiles").update({ onboarding_completed: true, grade }).eq("id", data.user.id);
      if (profileError) errors.push(`${email}: تعذر تحديث بيانات الطالب`);
    }
  }

  let groupId: string | null = null;
  if (createdIds.length) {
    const { data: existing } = await admin.from("account_groups").select("id, teacher_id").eq("name", groupName).eq("grade", grade).maybeSingle();
    if (existing?.id) {
      groupId = existing.id;
      if (teacherId && existing.teacher_id && existing.teacher_id !== teacherId) errors.push("الفصل موجود بالفعل ومربوط بمعلم آخر؛ تم الإبقاء على الربط الحالي.");
      else if (teacherId && !existing.teacher_id) await admin.from("account_groups").update({ teacher_id: teacherId }).eq("id", groupId);
    } else {
      const { data: group, error: groupError } = await admin.from("account_groups").insert({ name: groupName, grade, teacher_id: teacherId }).select("id").single();
      if (groupError) errors.push(`تعذر إنشاء الفصل: ${groupError.message}`);
      groupId = group?.id ?? null;
    }
    if (groupId) {
      const { error } = await admin.from("account_group_members").upsert(createdIds.map((user_id) => ({ group_id: groupId, user_id })), { onConflict: "group_id,user_id", ignoreDuplicates: true });
      if (error) errors.push(`تعذر ربط الحسابات بالفصل: ${error.message}`);
    }
    if (teacherId) {
      const { error } = await admin.from("teacher_students").upsert(createdIds.map((student_id) => ({ teacher_id: teacherId, student_id })), { onConflict: "teacher_id,student_id", ignoreDuplicates: true });
      if (error) errors.push(`تعذر ربط الطلاب بالمعلم: ${error.message}`);
    }
  }

  return NextResponse.json({ count: credentials.length, requested: count, groupId, teacherId, credentials, errors });
}
