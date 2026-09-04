import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import NewCourseForm from "./new-course-form";
import DeleteCourseButton from "./delete-course-button";
import BackButton from "@/components/back-button";

export default async function AdminCoursesPage() {
  const supabase = await createClient();
  const adminClient = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!["admin", "teacher"].includes(profile?.role ?? "")) redirect("/dashboard");

  const { data: courses } = await adminClient
    .from("courses")
    .select("id, title, description, grade, school_type, subjects(name)")
    .order("created_at", { ascending: false });

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
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/admin/subjects"
              className="text-sm text-ink-soft border border-line rounded-md px-3.5 py-1.5"
            >
              المواد الدراسية
            </Link>
            <Link
              href="/dashboard/admin"
              className="text-sm text-ink-soft border border-line rounded-md px-3.5 py-1.5"
            >
              إدارة المستخدمين
            </Link>
          </div>
        </div>
        <p className="text-sm text-ink-soft mb-8">
          أضف كورس جديد، وبعدين ادخله عشان تضيف دروس وفيديوهات وكويزات.
        </p>

        <NewCourseForm />

        <div className="space-y-3 mt-8">
          {(courses ?? []).map((c) => (
            <Link
              key={c.id}
              href={`/dashboard/admin/courses/${c.id}`}
              className="block bg-surface border border-line rounded-xl p-5 hover:border-green transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-display text-lg font-medium text-ink">
                  {c.title}
                </h3>
                <DeleteCourseButton courseId={c.id} courseTitle={c.title} />
              </div>
              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                {c.grade && (
                  <span className="inline-block text-xs bg-green-light text-green-text px-2 py-0.5 rounded-full">
                    {c.grade}
                  </span>
                )}
                {c.school_type && (
                  <span className="inline-block text-xs bg-gold-light text-gold-text px-2 py-0.5 rounded-full">
                    {c.school_type}
                  </span>
                )}
                {(c.subjects as unknown as { name: string } | null)?.name && (
                  <span className="inline-block text-xs bg-paper border border-line text-ink-soft px-2 py-0.5 rounded-full">
                    {(c.subjects as unknown as { name: string }).name}
                  </span>
                )}
              </div>
              {c.description && (
                <p className="text-sm text-ink-soft mt-1">{c.description}</p>
              )}
            </Link>
          ))}
          {(!courses || courses.length === 0) && (
            <p className="text-sm text-ink-faint text-center py-8">
              لسه مفيش كورسات — ضيف أول واحد فوق.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
