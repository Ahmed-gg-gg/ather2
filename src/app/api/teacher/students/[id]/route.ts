import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: studentId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "سجّل الدخول أولًا." }, { status: 401 });

  const admin = createAdminClient();
  const { data: actor } = await admin.from("profiles").select("role").eq("id", user.id).single();
  if (actor?.role !== "teacher" && actor?.role !== "admin") {
    return NextResponse.json({ error: "غير مسموح لك بحذف الطلاب." }, { status: 403 });
  }

  const { data: student } = await admin.from("profiles").select("id, role, full_name").eq("id", studentId).single();
  if (!student || student.role !== "student") {
    return NextResponse.json({ error: "الطالب غير موجود." }, { status: 404 });
  }

  if (actor.role === "teacher") {
    const { data: link } = await admin.from("teacher_students").select("student_id").eq("teacher_id", user.id).eq("student_id", studentId).maybeSingle();
    if (!link) return NextResponse.json({ error: "هذا الطالب غير مرتبط بحسابك." }, { status: 403 });

    // Remove only this teacher's relationship. Preserve the account for any other teacher.
    const { error } = await admin.from("teacher_students").delete().eq("teacher_id", user.id).eq("student_id", studentId);
    if (error) return NextResponse.json({ error: "تعذر إزالة الطالب من قائمتك." }, { status: 500 });
    return NextResponse.json({ success: true, message: "تمت إزالة الطالب من قائمتك." });
  }

  const { error } = await admin.auth.admin.deleteUser(studentId);
  if (error) return NextResponse.json({ error: "تعذر حذف حساب الطالب." }, { status: 500 });
  return NextResponse.json({ success: true, message: "تم حذف حساب الطالب." });
}
