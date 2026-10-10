"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GRADES } from "@/lib/grades";

export default function AddStudentForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [grade, setGrade] = useState(GRADES[3] ?? GRADES[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<{ email: string; password: string } | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setCreated(null);
    try {
      const response = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, role: "student", grade }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "تعذر إنشاء حساب الطالب.");
        return;
      }
      setCreated({ email: data.email, password: data.password });
      setFullName("");
      setEmail("");
      router.refresh();
    } catch {
      setError("تعذر الاتصال بالخادم. حاول مرة أخرى.");
    } finally {
      setLoading(false);
    }
  }

  return <section className="bg-surface border border-line rounded-xl p-5 sm:p-6 mb-6">
    <div className="mb-4"><h2 className="font-display text-lg font-medium text-ink">إضافة طالب جديد <span aria-hidden="true">➕</span></h2><p className="text-sm text-ink-soft mt-1">اكتب بيانات الطالب فقط؛ سننشئ كلمة المرور ونربطه بحسابك تلقائيًا.</p></div>
    <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <label className="text-sm text-ink-soft">اسم الطالب<input required value={fullName} onChange={e => setFullName(e.target.value)} className="mt-1 w-full border border-line rounded-md px-3 py-2.5 bg-paper text-ink" placeholder="مثال: محمد أحمد" /></label>
      <label className="text-sm text-ink-soft">البريد الإلكتروني<input required type="email" dir="ltr" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 w-full border border-line rounded-md px-3 py-2.5 bg-paper text-ink text-left" placeholder="student@example.com" /></label>
      <label className="text-sm text-ink-soft sm:col-span-2">الصف<select value={grade} onChange={e => setGrade(e.target.value)} className="mt-1 w-full border border-line rounded-md px-3 py-2.5 bg-paper text-ink">{GRADES.map(g => <option key={g} value={g}>{g}</option>)}</select></label>
      {error && <p className="sm:col-span-2 text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={loading} className="sm:col-span-2 bg-green text-white rounded-md px-4 py-3 text-sm font-medium disabled:opacity-60">{loading ? "جاري إضافة الطالب…" : "إضافة الطالب"}</button>
    </form>
    {created && <div className="mt-4 rounded-lg border border-green-light bg-paper p-4 text-sm"><p className="font-medium text-green-text mb-2">تم إنشاء الحساب وربطه بك بنجاح. انسخ بيانات الدخول وأرسلها للطالب:</p><p dir="ltr" className="text-ink break-all">البريد: {created.email}</p><p dir="ltr" className="text-ink mt-1">كلمة المرور: {created.password}</p><button type="button" onClick={() => void navigator.clipboard?.writeText(`البريد: ${created.email}\nكلمة المرور: ${created.password}`)} className="mt-3 bg-green text-white rounded-md px-3 py-2 text-xs">نسخ بيانات الدخول</button></div>}
  </section>;
}
