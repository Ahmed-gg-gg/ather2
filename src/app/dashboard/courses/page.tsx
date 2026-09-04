import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BackButton from "@/components/back-button";

const GRADE_ALIASES: Record<string, string> = {
  "الأول الابتدائي": "Grade 1",
  "الثاني الابتدائي": "Grade 2",
  "الثالث الابتدائي": "Grade 3",
  "الرابع الابتدائي": "Grade 4",
  "الخامس الابتدائي": "Grade 5",
  "السادس الابتدائي": "Grade 6",
  "الأول الإعدادي": "Grade 7",
  "الثاني الإعدادي": "Grade 8",
  "الثالث الإعدادي": "Grade 9",
  "الأول الثانوي": "Grade 10",
  "الثاني الثانوي": "Grade 11",
  "الثالث الثانوي": "Grade 12",
};

function gradeVariants(grade: string | null | undefined) {
  if (!grade) return [];
  const arabic = Object.entries(GRADE_ALIASES).find(([, english]) => english === grade)?.[0];
  const english = GRADE_ALIASES[grade];
  return Array.from(new Set([grade, arabic, english].filter(Boolean))) as string[];
}

export default async function CoursesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, grade")
    .eq("id", user.id)
    .single();

  let query = supabase
    .from("courses")
    .select("id, title, description, grade")
    .order("created_at", { ascending: false });

  // Students only see courses matching their grade (plus ungraded/public ones).
  // Older student accounts may store grades as "Grade 4", while course creation
  // uses the Arabic labels from GRADES, so accept both representations.
  if (profile?.role === "student") {
    const variants = gradeVariants(profile.grade);
    const gradeFilter = variants.length
      ? `grade.is.null,${variants.map((value) => `grade.eq.${value}`).join(",")}`
      : "grade.is.null";
    query = query.or(gradeFilter);
  }

  const { data: courses } = await query;

  return (
    <div className="min-h-screen bg-paper">
      <div className="max-w-3xl mx-auto px-8 py-10">
        <div className="mb-4">
          <BackButton />
        </div>
        <div className="flex items-center justify-between mb-1">
          <h1 className="font-display text-2xl font-medium text-ink">
            الكورسات
          </h1>
          <Link
            href="/dashboard"
            className="text-sm text-ink-soft border border-line rounded-md px-3.5 py-1.5"
          >
            رجوع للداشبورد
          </Link>
        </div>
        <p className="text-sm text-ink-soft mb-8">
          {profile?.role === "student" && profile.grade
            ? `الكورسات المتاحة لـ ${profile.grade}`
            : "اختار كورس وابدأ تتفرج على الدروس وتحل الكويزات."}
        </p>

        <div className="space-y-3">
          {(courses ?? []).map((c) => (
            <Link
              key={c.id}
              href={`/dashboard/courses/${c.id}`}
              className="block bg-surface border border-line rounded-xl p-5 hover:border-green transition-colors"
            >
              <h3 className="font-display text-lg font-medium text-ink">
                {c.title}
              </h3>
              {c.grade && (
                <span className="inline-block text-xs bg-green-light text-green-text px-2 py-0.5 rounded-full mt-1.5">
                  {c.grade}
                </span>
              )}
              {c.description && (
                <p className="text-sm text-ink-soft mt-1">{c.description}</p>
              )}
            </Link>
          ))}
          {(!courses || courses.length === 0) && (
            <p className="text-sm text-ink-faint text-center py-8">
              لسه مفيش كورسات متاحة.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
