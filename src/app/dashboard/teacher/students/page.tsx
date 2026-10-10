import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BackButton from "@/components/back-button";
import AddStudentForm from "./add-student-form";

export default async function TeacherStudentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role, full_name").eq("id", user.id).single();
  if (profile?.role !== "teacher") redirect("/dashboard");

  const { data: links } = await supabase.from("teacher_students").select("student_id").eq("teacher_id", user.id);
  const ids = [...new Set((links ?? []).map((link) => link.student_id))];
  const { data: students } = ids.length
    ? await supabase.from("profiles").select("id, full_name, grade, is_active, created_at").in("id", ids).eq("role", "student").order("full_name")
    : { data: [] };

  return <main className="min-h-screen bg-paper"><div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
    <div className="mb-4"><BackButton /></div>
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
      <div><h1 className="font-display text-2xl font-medium text-ink">إدارة طلابي 👥</h1><p className="text-sm text-ink-soft mt-1">هذه القائمة تعرض الطلاب المرتبطين بحسابك فقط.</p></div>
      <Link href="/dashboard/admin/courses" className="bg-green text-white rounded-md px-4 py-2 text-sm">إدارة كورساتي 📚</Link>
    </div>
    <AddStudentForm />
    <div className="bg-surface border border-line rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-line text-sm text-ink-soft">عدد الطلاب المرتبطين بك: <strong className="text-ink">{students?.length ?? 0}</strong></div>
      {(students ?? []).map((student) => <div key={student.id} className="px-5 py-4 border-b border-line last:border-0 flex items-center justify-between gap-3">
        <div><p className="text-sm font-medium text-ink">{student.full_name || "طالب بدون اسم"}</p><p className="text-xs text-ink-soft mt-1">{student.grade || "لم يتم تحديد الصف"}</p></div>
        <span className={`text-xs rounded-full px-2.5 py-1 ${student.is_active === false ? "bg-red-50 text-red-600" : "bg-green-light text-green-text"}`}>{student.is_active === false ? "معطل" : "نشط"}</span>
      </div>)}
      {(!students || students.length === 0) && <p className="p-6 text-sm text-ink-faint">لا يوجد طلاب مرتبطون بحسابك حتى الآن. اطلب من المدير ربط الطلاب بحسابك من صفحة المجموعات والفصول.</p>}
    </div>
  </div></main>;
}
