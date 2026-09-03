import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "parent") redirect("/dashboard");

  const { data: links } = await supabase
    .from("parent_student")
    .select("student_id, profiles(id, full_name, grade)")
    .eq("parent_id", user.id);

  const students = (links ?? [])
    .map((l) => l.profiles as unknown as { id: string; full_name: string; grade: string | null } | null)
    .filter((s): s is { id: string; full_name: string; grade: string | null } => !!s);

  const studentData = await Promise.all(
    students.map(async (student) => {
      const { data: attempts } = await supabase
        .from("quiz_attempts")
        .select(
          "quiz_id, score, total, quizzes(title, lessons(title, courses(title)))"
        )
        .eq("user_id", student.id)
        .order("created_at", { ascending: true });

      const bestByQuiz = new Map<string, AttemptRow>();
      for (const a of (attempts ?? []) as unknown as AttemptRow[]) {
        const current = bestByQuiz.get(a.quiz_id);
        if (!current || a.score / a.total > current.score / current.total) {
          bestByQuiz.set(a.quiz_id, a);
        }
      }

      return { student, results: Array.from(bestByQuiz.values()) };
    })
  );

  return (
    <div className="min-h-screen bg-paper">
      <div className="max-w-3xl mx-auto px-8 py-10">
        <div className="mb-4">
          <BackButton />
        </div>
        <h1 className="font-display text-2xl font-medium text-ink mb-1">
          متابعة الأبناء
        </h1>
        <p className="text-sm text-ink-soft mb-8">
          أعلى نتيجة حققها كل ابن في كل كويز حله.
        </p>

        <div className="space-y-6">
          {studentData.map(({ student, results }) => (
            <div
              key={student.id}
              className="bg-surface border border-line rounded-xl p-5"
            >
              <div className="flex items-center gap-2 mb-3">
                <h3 className="font-display text-base font-medium text-ink">
                  {student.full_name}
                </h3>
                {student.grade && (
                  <span className="text-xs bg-green-light text-green-text px-2.5 py-1 rounded-full">
                    {student.grade}
                  </span>
                )}
              </div>

              {results.length === 0 ? (
                <p className="text-sm text-ink-faint">
                  لسه معملش أي كويز.
                </p>
              ) : (
                <div className="space-y-2">
                  {results.map((r) => (
                    <div
                      key={r.quiz_id}
                      className="flex items-center justify-between text-sm border-t border-line pt-2"
                    >
                      <div>
                        <p className="text-ink">{r.quizzes?.title}</p>
                        <p className="text-xs text-ink-faint">
                          {r.quizzes?.lessons?.courses?.title} —{" "}
                          {r.quizzes?.lessons?.title}
                        </p>
                      </div>
                      <span className="font-mono text-xs text-ink-soft">
                        {r.score} / {r.total}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {studentData.length === 0 && (
            <p className="text-sm text-ink-faint text-center py-8">
              مفيش أبناء مرتبطين بحسابك دلوقتي. كلم الأدمن عشان يربطهم.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
