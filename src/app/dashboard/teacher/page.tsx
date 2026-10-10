import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function TeacherDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("full_name, role, onboarding_completed").eq("id", user.id).single();
  if (profile?.onboarding_completed === false) redirect("/onboarding");
  if (profile?.role !== "teacher") redirect("/dashboard");

  const { data: links } = await supabase.from("teacher_students").select("student_id").eq("teacher_id", user.id);
  const studentIds = [...new Set((links ?? []).map((row) => row.student_id))];
  const students = studentIds.length
    ? ((await supabase.from("profiles").select("id", { count: "exact", head: true }).in("id", studentIds).eq("role", "student").eq("is_active", true)).count ?? 0)
    : 0;
  const { count: attempts } = studentIds.length
    ? await supabase.from("quiz_attempts").select("id", { count: "exact", head: true }).in("user_id", studentIds)
    : { count: 0 };
  const { data: recent } = studentIds.length
    ? await supabase.from("quiz_attempts").select("id, score, total, created_at, profiles(full_name), quizzes(title)").in("user_id", studentIds).order("created_at", { ascending: false }).limit(8)
    : { data: [] };
  const avg = (recent ?? []).length
    ? Math.round((recent ?? []).reduce((sum, row) => sum + (row.total ? Number(row.score) / Number(row.total) * 100 : 0), 0) / (recent ?? []).length)
    : 0;

  const actions = [
    { href: "/dashboard/teacher/students", icon: "👥", title: "طلابك", description: "أضف طالبًا جديدًا أو راجع طلابك", action: "إدارة الطلاب", primary: true },
    { href: "/dashboard/admin/courses", icon: "📚", title: "الكورسات", description: "أنشئ كورسًا وأضف الدروس والاختبارات", action: "إدارة الكورسات" },
    { href: "/dashboard/results", icon: "📊", title: "النتائج", description: "تابع أداء طلابك ودرجاتهم", action: "عرض النتائج" },
    { href: "/dashboard/ai", icon: "🤖", title: "المساعد الذكي", description: "ساعدك في تحضير الأسئلة والأنشطة", action: "افتح المساعد" },
  ];

  return <main className="min-h-screen bg-paper">
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-7 sm:py-10">
      <header className="rounded-2xl bg-surface border border-line p-5 sm:p-7 mb-6">
        <p className="text-sm text-green-text font-medium mb-2">أثر · مساحة المعلم</p>
        <h1 className="font-display text-2xl sm:text-3xl font-medium text-ink">أهلًا {profile?.full_name || "بك"} 👋</h1>
        <p className="text-sm text-ink-soft mt-2 max-w-2xl">كل ما تحتاجه في مكان واحد. ابدأ بإضافة طلابك، ثم أنشئ كورساتك وتابع تقدمهم بسهولة.</p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-7" aria-label="ملخص الأداء">
        <div className="bg-surface border border-line rounded-xl p-4"><p className="text-xs text-ink-faint">الطلاب النشطون</p><p className="text-3xl font-bold text-ink mt-2">{students}</p></div>
        <div className="bg-surface border border-line rounded-xl p-4"><p className="text-xs text-ink-faint">محاولات الاختبارات</p><p className="text-3xl font-bold text-ink mt-2">{attempts ?? 0}</p></div>
        <div className="bg-surface border border-line rounded-xl p-4"><p className="text-xs text-ink-faint">متوسط آخر النتائج</p><p className="text-3xl font-bold text-ink mt-2">{avg}%</p></div>
        <div className="bg-surface border border-line rounded-xl p-4 flex flex-col justify-between"><p className="text-xs text-ink-faint">جاهز تبدأ؟</p><Link href="/dashboard/teacher/students" className="text-sm font-medium text-green-text mt-2">＋ أضف طالبك الأول</Link></div>
      </section>

      <section>
        <h2 className="font-display text-xl font-medium text-ink mb-3">اختصارات سريعة</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {actions.map((item) => <Link key={item.href} href={item.href} className={`group rounded-xl border p-5 transition-colors hover:border-green ${item.primary ? "bg-green-light border-green-light" : "bg-surface border-line"}`}>
            <div className="flex items-start gap-3"><span className="text-2xl" aria-hidden="true">{item.icon}</span><div className="min-w-0 flex-1"><h3 className="font-medium text-ink">{item.title}</h3><p className="text-sm text-ink-soft mt-1">{item.description}</p><p className="text-sm font-medium text-green-text mt-4">{item.action} ←</p></div></div>
          </Link>)}
        </div>
      </section>

      <section className="mt-8">
        <div className="flex items-center justify-between gap-3 mb-3"><h2 className="font-display text-xl font-medium text-ink">أحدث نتائج طلابك</h2><Link href="/dashboard/results" className="text-sm text-green-text">كل النتائج</Link></div>
        <div className="bg-surface border border-line rounded-xl overflow-hidden">
          {(recent ?? []).map((row: any) => <div key={row.id} className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_1fr_auto] items-center gap-3 px-4 py-3 border-b border-line last:border-0"><div className="text-sm text-ink truncate">{row.profiles?.full_name ?? "طالب"}</div><div className="hidden sm:block text-sm text-ink-soft truncate">{row.quizzes?.title ?? "اختبار"}</div><div className="text-sm font-bold text-ink">{row.total ? Math.round(Number(row.score) / Number(row.total) * 100) : 0}%</div></div>)}
          {(!recent || recent.length === 0) && <div className="p-6 text-center"><p className="text-sm text-ink">لا توجد نتائج حتى الآن.</p><p className="text-xs text-ink-faint mt-1">ستظهر هنا نتائج طلابك بعد حل الاختبارات.</p></div>}
        </div>
      </section>
    </div>
  </main>;
}
