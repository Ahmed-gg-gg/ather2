"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function NewLessonForm({ courseId }: { courseId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [title, setTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.from("lessons").insert({
      course_id: courseId,
      title,
      video_url: videoUrl || null,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setTitle("");
    setVideoUrl("");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-surface border border-line rounded-xl p-6 flex flex-col gap-3"
    >
      <input
        className="w-full px-3 py-2.5 border border-line rounded-md bg-paper text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-green"
        placeholder="اسم الدرس"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <input
        className="w-full px-3 py-2.5 border border-line rounded-md bg-paper text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-green text-left"
        dir="ltr"
        placeholder="رابط فيديو يوتيوب (اختياري)"
        value={videoUrl}
        onChange={(e) => setVideoUrl(e.target.value)}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="bg-green text-white text-sm font-medium py-2.5 rounded-md disabled:opacity-60"
      >
        {loading ? "جاري الإضافة…" : "إضافة الدرس"}
      </button>
    </form>
  );
}
