import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function generatePassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const bytes = new Uint32Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (value) => chars[value % chars.length]).join("");
}

function emailSlug(name: string) {
  const arabic: Record<string, string> = {
    ا:"a",أ:"a",إ:"e",آ:"a",ب:"b",ت:"t",ث:"th",ج:"g",ح:"h",خ:"kh",د:"d",ذ:"z",ر:"r",ز:"z",س:"s",ش:"sh",ص:"s",ض:"d",ط:"t",ظ:"z",ع:"a",غ:"gh",ف:"f",ق:"q",ك:"k",ل:"l",م:"m",ن:"n",ه:"h",ة:"a",و:"w",ي:"y",ى:"a",ء:"",ئ:"y",ؤ:"w"
  };
  const normalized = [...name.toLowerCase()].map((char) => arabic[char] ?? char).join("")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, ".").replace(/^\.|\.$/g, "");
  return normalized || "student";
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "غير مسجل الدخول" }, { status: 401 });

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
  const actorRole = profile?.role ?? "";
  if (!["admin", "teacher"].includes(actorRole)) return NextResponse.json({ error: "الأدمن أو المعلم فقط يمكنهما إنشاء الحسابات" }, { status: 403 });

  const body = await request.json();
  const fullName = String(body.fullName ?? "").trim();
  const suppliedEmail = String(body.email ?? "").trim().toLowerCase();
  const role = String(body.role ?? "");
  const grade = body.grade ? String(body.grade).trim() : null;
  const password = typeof body.password === "string" && body.password.length ? body.password : null;
  const studentIds = body.studentIds;

  if (!fullName || !role) return NextResponse.json({ error: "اكتب الاسم وحدد نوع الحساب." }, { status: 400 });
  if (suppliedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(suppliedEmail)) return NextResponse.json({ error: "صيغة البريد الإلكتروني غير صحيحة." }, { status: 400 });
  const allowedRoles = actorRole === "admin" ? ["teacher", "student", "parent", "admin"] : ["student", "parent"];
  if (!allowedRoles.includes(role)) return NextResponse.json({ error: "المعلم يمكنه إضافة الطلاب وأولياء الأمور فقط." }, { status: 403 });

  const finalPassword = password ?? generatePassword();
  const baseEmail = suppliedEmail || `${emailSlug(fullName)}@athar.com`;
  const baseParts = baseEmail.split("@");
  const baseName = baseParts[0];
  const domain = baseParts[1];
  let createdUser: { id: string; email?: string } | null = null;
  let createError: string | null = null;

  // If the email is generated from a name, append a number when that name is already taken.
  for (let attempt = 0; attempt < 30; attempt++) {
    const candidate = suppliedEmail
      ? baseEmail
      : `${baseName}${attempt === 0 ? "" : attempt + 1}@${domain}`;
    const { data, error } = await admin.auth.admin.createUser({
      email: candidate,
      password: finalPassword,
      email_confirm: true,
      user_metadata: { full_name: fullName, role, grade: role === "student" ? grade : null },
    });
    if (!error && data.user) {
      createdUser = { id: data.user.id, email: data.user.email ?? candidate };
      break;
    }
    createError = error?.message ?? "تعذر إنشاء الحساب.";
    if (suppliedEmail || !/already|registered|exists|duplicate/i.test(createError)) break;
  }

  if (!createdUser) return NextResponse.json({
    error: suppliedEmail && /already|registered|exists|duplicate/i.test(createError ?? "")
      ? "البريد ده مستخدم بالفعل. اكتب بريدًا آخر أو امسح البريد ليتم توليده تلقائيًا."
      : createError ?? "تعذر إنشاء الحساب.",
  }, { status: 400 });

  await admin.from("profiles").update({ onboarding_completed: true, ...(role === "student" ? { grade } : {}) }).eq("id", createdUser.id);

  if (actorRole === "teacher" && role === "student") {
    const { error } = await admin.from("teacher_students").upsert(
      { teacher_id: user.id, student_id: createdUser.id },
      { onConflict: "teacher_id,student_id", ignoreDuplicates: true },
    );
    if (error) {
      await admin.auth.admin.deleteUser(createdUser.id);
      return NextResponse.json({ error: "تعذر ربط الطالب بحسابك، وتم إلغاء إنشاء الحساب." }, { status: 500 });
    }
  }

  if (role === "parent" && Array.isArray(studentIds) && studentIds.length) {
    await admin.from("parent_student").insert(studentIds.map((studentId: string) => ({ parent_id: createdUser!.id, student_id: studentId })));
  }

  return NextResponse.json({ id: createdUser.id, email: createdUser.email, password: finalPassword });
}
