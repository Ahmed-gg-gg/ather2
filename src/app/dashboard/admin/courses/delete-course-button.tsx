"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function DeleteCourseButton({
  courseId,
  courseTitle,
}: {
  courseId: string;
  courseTitle: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDeleting(true);
    setError(null);

    const { error } = await supabase.from("courses").delete().eq("id", courseId);

    setDeleting(false);

    if (error) {
      setError(error.message);
      return;
    }

    setConfirming(false);
    router.refresh();
  }

  if (confirming) {
    return (
      <div
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        className="flex flex-col items-end gap-1"
      >
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-xs bg-red-600 text-white px-2.5 py-1 rounded-md disabled:opacity-60"
          >
            {deleting ? "جاري الحذف…" : "متأكد؟ هيتمسح كل الدروس والكويزات"}
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setConfirming(false);
            }}
            className="text-xs text-ink-soft px-2 py-1"
          >
            إلغاء
          </button>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setConfirming(true);
      }}
      className="text-xs text-red-600 border border-line rounded-md px-2.5 py-1"
      title={`حذف ${courseTitle}`}
    >
      حذف
    </button>
  );
}
