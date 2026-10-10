"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RemoveStudentButton({ studentId, studentName }: { studentId: string; studentName: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function removeStudent() {
    if (!window.confirm(`هل تريد إزالة ${studentName} من قائمة طلابك؟ لن يُحذف حسابه إذا كان مرتبطًا بمعلم آخر.`)) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/teacher/students/${studentId}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "تعذر إزالة الطالب.");
        return;
      }
      router.refresh();
    } catch {
      setError("تعذر الاتصال بالخادم. حاول مرة أخرى.");
    } finally {
      setBusy(false);
    }
  }

  return <div className="flex flex-col items-end gap-1">
    <button type="button" onClick={removeStudent} disabled={busy} className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50">
      {busy ? "جارٍ الحذف…" : "🗑️ إزالة"}
    </button>
    {error && <span role="alert" className="max-w-40 text-xs text-red-600">{error}</span>}
  </div>;
}
