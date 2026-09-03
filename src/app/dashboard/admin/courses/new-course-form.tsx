"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { GRADES } from "@/lib/grades";

type Subject = { id: string; name: string; language: "ar" | "en" };
type SchoolType = "تجريبي" | "عربي" | "خاص";

export default function NewCourseForm() {
  const router = useRouter();
  const supabase = createClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [grade, setGrade] = useState(GRADES[0]);
  const [schoolType, setSchoolType] = useState<SchoolType>("عربي");
  const [studyLanguage, setStudyLanguage] = useState<"ar" | "en">("ar");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectId, setSubjectId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("subjects")
      .select("id, name, language")
      .then(({ data }) => setSubjects((data as Subject[]) ?? []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // اللغة الفعلية للكورس: تجريبي = إنجليزي ثابت، عربي = عربي ثابت،
  // خاص = حسب ما الأدمن يختار
  const effectiveLanguage: "ar" | "en" =
    schoolType === "تجريبي" ? "en" : schoolType === "عربي" ? "ar" : studyLanguage;

  const filteredSubjects = subjects.filter(
    (s) => s.language === effectiveLanguage
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from("courses").insert({
      title,
      description,
      grade,
      subject_id: subjectId || null,
      school_type: schoolType,
      study_language: schoolType === "خاص" ? studyLanguage : null,
      created_by: user?.id,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setTitle("");
    setDescription("");
    setSubjectId("");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-surface border border-line rounded-xl p-6 flex flex-col gap-3"
    >
      <input
        className="w-full px-3 py-2.5 border border-line rounded-md bg-paper text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-green"
        placeholder="اسم الكورس"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <input
        className="w-full px-3 py-2.5 border border-line rounded-md bg-paper text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-green"
        placeholder="وصف مختصر (اختياري)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <select
        className="w-full px-3 py-2.5 border border-line rounded-md bg-paper text-sm text-ink focus:outline-none focus:border-green"
        value={grade}
        onChange={(e) => setGrade(e.target.value)}
      >
        {GRADES.map((g) => (
          <option key={g} value={g}>
            {g}
          </option>
        ))}
      </select>

      <select
        className="w-full px-3 py-2.5 border border-line rounded-md bg-paper text-sm text-ink focus:outline-none focus:border-green"
        value={schoolType}
        onChange={(e) => setSchoolType(e.target.value as SchoolType)}
      >
        <option value="عربي">مدارس عربي</option>
        <option value="تجريبي">مدارس تجريبي (لغات)</option>
        <option value="خاص">مدارس خاص</option>
      </select>

      {schoolType === "خاص" && (
        <select
          className="w-full px-3 py-2.5 border border-line rounded-md bg-paper text-sm text-ink focus:outline-none focus:border-green"
          value={studyLanguage}
          onChange={(e) => setStudyLanguage(e.target.value as "ar" | "en")}
        >
          <option value="ar">لغة الدراسة: عربي</option>
          <option value="en">لغة الدراسة: إنجليزي</option>
        </select>
      )}

      <select
        className="w-full px-3 py-2.5 border border-line rounded-md bg-paper text-sm text-ink focus:outline-none focus:border-green"
        value={subjectId}
        onChange={(e) => setSubjectId(e.target.value)}
      >
        <option value="">بدون مادة محددة</option>
        {filteredSubjects.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="bg-green text-white text-sm font-medium py-2.5 rounded-md disabled:opacity-60"
      >
        {loading ? "جاري الإضافة…" : "إضافة كورس"}
      </button>
    </form>
  );
}
