import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NewLessonForm from "./new-lesson-form";
import NewQuizForm from "./new-quiz-form";
import BackButton from "@/components/back-button";

export default async function AdminCourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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
  if (!["admin", "teacher"].includes(profile?.role ?? "")) redirect("/dashboard");

  const { data: course } = await supabase
    .from("courses")
    .select("id, title")
    .eq("id", id)
    .single();

  const { data: lessons } = await supabase
    .from("lessons")
    .select("id, title, video_url, position, quizzes(id, title)")
    .eq("course_id", id)
    .order("position", { ascending: true });

  const quizIds = (lessons ?? [])
    .flatMap((l) => l.quizzes ?? [])
    .map((q) => q.id);

  const { data: attempts } =
    quizIds.length > 0
      ? await supabase
          .from("quiz_attempts")
          .select("quiz_id, score, total, created_at, profiles(full_name)")
          .in("quiz_id", quizIds)
          .order("created_at", { ascending: false })
      : { data: [] };

  const attemptsByQuiz = new Map<string, typeof attempts>();
  for (const a of attempts ?? []) {
    const list = attemptsByQuiz.get(a.quiz_id) ?? [];
    list.push(a);
    attemptsByQuiz.set(a.quiz_id, list);
  }

  return (
    <div className="min-h-screen bg-paper">
      <div className="max-w-3xl mx-auto px-8 py-10">
        <div className="mb-4">
          <BackButton />
        </div>
        <h1 className="font-display text-2xl font-medium text-ink mb-1">
          {course?.title}
        </h1>
        <p className="text-sm text-ink-soft mb-8">إدارة الدروس والكويزات</p>

        <h2 className="text-sm font-medium text-ink mb-3">إضافة درس جديد</h2>
        <NewLessonForm courseId={id} />

        <div className="space-y-4 mt-8">
          {(lessons ?? []).map((lesson) => (
            <div
              key={lesson.id}
              className="bg-surface border border-line rounded-xl p-5"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-display text-base font-medium text-ink">
                  {lesson.title}
                </h3>
              </div>
              {lesson.video_url && (
                <p dir="ltr" className="text-xs text-ink-faint break-all mb-3">
                  {lesson.video_url}
                </p>
              )}

              {lesson.quizzes && lesson.quizzes.length > 0 ? (
                <div>
                  <span className="text-xs bg-green-light text-green-text px-2.5 py-1 rounded-full">
                    فيه كويز: {lesson.quizzes[0].title}
                  </span>

                  <div className="mt-3 border-t border-line pt-3">
                    <p className="text-xs font-medium text-ink-soft mb-2">
                      نتائج الطلاب
                    </p>
                    {(attemptsByQuiz.get(lesson.quizzes[0].id) ?? []).length ===
                    0 ? (
                      <p className="text-xs text-ink-faint">
                        لسه محدش حل الكويز ده.
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        {(attemptsByQuiz.get(lesson.quizzes[0].id) ?? []).map(
                          (a, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between text-sm"
                            >
                              <span className="text-ink">
                                {(a.profiles as unknown as { full_name: string } | null)
                                  ?.full_name ?? "طالب"}
                              </span>
                              <span className="font-mono text-xs text-ink-soft">
                                {a.score} / {a.total}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <NewQuizForm lessonId={lesson.id} />
              )}
            </div>
          ))}
          {(!lessons || lessons.length === 0) && (
            <p className="text-sm text-ink-faint text-center py-8">
              لسه مفيش دروس في الكورس ده.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
