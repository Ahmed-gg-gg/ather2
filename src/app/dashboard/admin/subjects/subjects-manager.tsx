"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Subject = {
  id: string;
  name: string;
  language: "ar" | "en";
};

export default function SubjectsManager({
  initialSubjects,
}: {
  initialSubjects: Subject[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [subjects, setSubjects] = useState(initialSubjects);
  const [name, setName] = useState("");
  const [language, setLanguage] = useState<"ar" | "en">("ar");
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("subjects")
      .insert({ name, language })
      .select()
      .single();

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setSubjects((s) => [data as Subject, ...s]);
    setName("");
    router.refresh();
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    setError(null);

    const { error } = await supabase.from("subjects").delete().eq("id", id);

    setDeletingId(null);

    if (error) {
      setError(error.message);
      return;
    }

    setSubjects((s) => s.filter((subj) => subj.id !== id));
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleAdd}
        className="bg-surface border border-line rounded-xl p-6 flex flex-col gap-3"
      >
        <input
          className="w-full px-3 py-2.5 border border-line rounded-md bg-paper text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-green"
          placeholder="اسم المادة (مثال: الرياضيات)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <select
          className="w-full px-3 py-2.5 border border-line rounded-md bg-paper text-sm text-ink focus:outline-none focus:border-green"
          value={language}
          onChange={(e) => setLanguage(e.target.value as "ar" | "en")}
        >
          <option value="ar">عربي (لمدارس العربي / خاص-عربي)</option>
          <option value="en">إنجليزي (لمدارس التجريبي / خاص-إنجليزي)</option>
        </select>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="bg-green text-white text-sm font-medium py-2.5 rounded-md disabled:opacity-60"
        >
          {loading ? "جاري الإضافة…" : "إضافة مادة"}
        </button>
      </form>

      <div className="bg-surface border border-line rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-line text-sm font-medium text-ink">
          المواد الحالية
        </div>
        {subjects.map((s) => (
          <div
            key={s.id}
            className="px-5 py-3 border-b border-line last:border-0 flex items-center justify-between text-sm"
          >
            <span className="text-ink">{s.name}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-green-light text-green-text px-2.5 py-1 rounded-full">
                {s.language === "ar" ? "عربي" : "إنجليزي"}
              </span>
              <button
                onClick={() => handleDelete(s.id)}
                disabled={deletingId === s.id}
                className="text-xs text-red-600 border border-line rounded-md px-2.5 py-1 disabled:opacity-60"
              >
                {deletingId === s.id ? "جاري الحذف…" : "حذف"}
              </button>
            </div>
          </div>
        ))}
        {subjects.length === 0 && (
          <p className="text-sm text-ink-faint text-center py-8">
            لسه مفيش مواد — ضيف أول واحدة فوق.
          </p>
        )}
      </div>
    </div>
  );
}
