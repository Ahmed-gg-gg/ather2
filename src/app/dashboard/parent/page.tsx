import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import BackButton from "@/components/back-button";

type AttemptRow = {
  quiz_id: string;
  score: number;
  total: number;
  quizzes: {
    title: string;
    lessons: { title: string; courses: { title: string } | null } | null;
  } | null;
};

export default async function ParentPage() {
  const supabase = await createClient();
  const adminClient = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await adminClient.from("profiles").select("role, full_name").eq("id", user.id).single();
  if (profile?.role !== "parent") redirect("/dashboard");

  const { data: links } = await adminClient
    .from("parent_student")
    .select("student_id, profiles(id, full_name, grade)")
    .eq("parent_id", user.id);

  const students = (links ?? [])
    .map((l) => l.profiles as unknown as { id: string; full_name: string; grade: string | null } | null)
    .filter((s): s is { id: string; full_name: string; grade: string | null } => !!s);

  const studentData = await Promise.all(students.map(async (student) => {
    const { data: attempts } = await adminClient
      .from("quiz_attempts")
      .select("quiz_id, score, total, quizzes(title, lessons(title, courses(title)))")
      .eq("user_id", student.id)
      .order("created_at", { ascending: true });

    const bestByQuiz = new Map<string, AttemptRow>();
    for (const a of (attempts ?? []) as unknown as AttemptRow[]) {
      const current = bestByQuiz.get(a.quiz_id);
      if (!current || (a.total && Number(a.score) / Number(a.total) > Number(current.score) / Number(current.total))) {
        bestByQuiz.set(a.quiz_id, a);
      }
    }
    return { student, results: Array.from(bestByQuiz.values()) };
  }));

  return (
    <div className="min-h-screen bg-paper">
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8 sm:py-10">
        <div className="mb-4"><BackButton /></div>
        <div className="flex flex-wrap items-end justify-between gap-3 mb-7">
          <div>
            <p className="text-xs text-green-text font-medium mb-1">ولي الأمر</p>
            <h1 className="font-display text-2xl font-medium text-ink">أبناؤك 👨‍👩‍👧‍👦</h1>
            <p className="text-sm text-ink-soft mt-1">هنا تشوف أبناء حسابك فقط ونتائجهم التعليمية.</p>
          </div>
          <span className="text-xs text-ink-soft border border-line rounded-full px-3 py-1.5" dir="ltr">{user.email}</span>
        </div>

        {studentData.length === 0 ? (
          <div className="bg-surface border border-line rounded-xl p-7 text-center">
            <div className="text-4xl mb-3">👨‍👩‍👧‍👦</div>
            <h2 className="font-display text-lg text-ink mb-2">لسه مفيش أبناء مرتبطين</h2>
            <p className="text-sm text-ink-soft">ربط الإيميل بالحساب لا يربط الابن تلقائيًا. لازم الأدمن يربط حساب الطالب بحساب ولي الأمر.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {studentData.map(({ student, results }) => (
              <section key={student.id} className="bg-surface border border-line rounded-xl p-5">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div>
                    <h2 className="font-display text-lg font-medium text-ink">{student.full_name}</h2>
                    {student.grade && <p className="text-xs text-ink-faint mt-1">{student.grade}</p>}
                  </div>
                  <span className="text-xs bg-green-light text-green-text px-2.5 py-1 rounded-full">ابني</span>
                </div>
                {results.length === 0 ? (
                  <p className="text-sm text-ink-faint">لسه معملش أي كويز.</p>
                ) : (
                  <div className="space-y-2">
                    {results.map((r) => (
                      <div key={r.quiz_id} className="flex items-center justify-between gap-4 border-t border-line pt-2">
                        <div className="min-w-0">
                          <p className="text-sm text-ink truncate">{r.quizzes?.title ?? "اختبار"}</p>
                          <p className="text-xs text-ink-faint truncate">{r.quizzes?.lessons?.courses?.title ?? ""} — {r.quizzes?.lessons?.title ?? ""}</p>
                        </div>
                        <span className="font-mono text-xs text-ink-soft shrink-0">{r.score} / {r.total}</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
