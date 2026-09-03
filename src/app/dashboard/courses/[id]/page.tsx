import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LessonQuizGate from "./lesson-quiz-gate";
import BackButton from "@/components/back-button";
import { getMaxAttempts, isKidsGrade } from "@/lib/kids-mode";

function toEmbedUrl(url: string) {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    }
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    return url;
  } catch {
    return url;
  }
}

export default async function CourseDetailPage({
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
    .select("grade")
    .eq("id", user.id)
    .single();

  const { data: course } = await supabase
    .from("courses")
    .select("id, title, description, grade")
    .eq("id", id)
    .single();

  const { data: lessons } = await supabase
    .from("lessons")
    .select(
      "id, title, video_url, position, quizzes(id, title, quiz_questions(id, question, options, correct_index, question_type, position))"
    )
    .eq("course_id", id)
    .order("position", { ascending: true });

  const { data: attempts } = await supabase
    .from("quiz_attempts")
    .select("quiz_id, score, total, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  const attemptsByQuiz = new Map<
    string,
    { score: number; total: number }[]
  >();
  for (const a of attempts ?? []) {
    const list = attemptsByQuiz.get(a.quiz_id) ?? [];
    list.push({ score: a.score, total: a.total });
    attemptsByQuiz.set(a.quiz_id, list);
  }

  // الصف بتاع الطالب هو المرجع لعدد المحاولات المسموح بيها ووضع الأطفال
  // (بيفضل ثابت حتى لو الكورس ليه صف مختلف)
  const studentGrade = profile?.grade ?? course?.grade ?? null;
  const kidsMode = isKidsGrade(studentGrade);
  const maxAttempts = getMaxAttempts(studentGrade);

  return (
    <div className={`min-h-screen ${kidsMode ? "kids-bg" : "bg-paper"}`}>
      <div className="max-w-3xl mx-auto px-8 py-10">
        <div className="mb-4">
          <BackButton />
        </div>
        <h1
          className={`font-display text-2xl font-medium mb-1 ${
            kidsMode ? "text-2xl sm:text-3xl text-[#7a3fa0]" : "text-ink"
          }`}
        >
          {kidsMode ? "🎈 " : ""}
          {course?.title}
        </h1>
        {course?.description && (
          <p className="text-sm text-ink-soft mb-8">{course.description}</p>
        )}

        <div className="space-y-6">
          {(lessons ?? []).map((lesson) => {
            const quiz = lesson.quizzes?.[0];
            const quizAttempts = quiz ? attemptsByQuiz.get(quiz.id) ?? [] : [];

            return (
              <div
                key={lesson.id}
                className={
                  kidsMode
                    ? "bg-white border-4 border-[#ffd166] rounded-3xl p-5 shadow-sm"
                    : "bg-surface border border-line rounded-xl p-5"
                }
              >
                <h3
                  className={`font-display text-base font-medium mb-3 ${
                    kidsMode ? "text-lg text-[#7a3fa0]" : "text-ink"
                  }`}
                >
                  {kidsMode ? "📚 " : ""}
                  {lesson.title}
                </h3>

                {lesson.video_url && (
                  <div className="aspect-video rounded-lg overflow-hidden mb-4 bg-black">
                    <iframe
                      className="w-full h-full"
                      src={toEmbedUrl(lesson.video_url)}
                      allowFullScreen
                    />
                  </div>
                )}

                {quiz && (
                  <LessonQuizGate
                    quizId={quiz.id}
                    title={quiz.title}
                    questions={(quiz.quiz_questions ?? [])
                      .sort((a, b) => a.position - b.position)
                      .map((q) => ({
                        id: q.id,
                        question: q.question,
                        options: q.options as string[],
                        correctIndex: q.correct_index,
                        type:
                          (q.question_type as "multiple_choice" | "true_false") ??
                          "multiple_choice",
                      }))}
                    attempts={quizAttempts}
                    maxAttempts={maxAttempts}
                    kidsMode={kidsMode}
                  />
                )}
              </div>
            );
          })}
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
