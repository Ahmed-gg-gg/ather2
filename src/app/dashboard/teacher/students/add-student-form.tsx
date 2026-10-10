"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GRADES } from "@/lib/grades";

export default function AddStudentForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [grade, setGrade] = useState(GRADES[3] ?? GRADES[0]);
  const [passwordMode, setPasswordMode] = useState<"random" | "manual">("random");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
        body: JSON.stringify({ fullName, email, role: "student", grade, password: passwordMode === "manual" ? password : null }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "تعذر إنشاء حساب الطالب.");
        return;
      }
      setCreated({ email: data.email, password: data.password });
      setFullName("");
      setEmail("");
      setPassword("");
      router.refresh();
    } catch {
      setError("تعذر الاتصال بالخادم. حاول مرة أخرى.");
    } finally {
      setLoading(false);
    }
  }

  return <section className="bg-surface border border-line rounded-xl p-5 mb-6">
    <h2 className="font-display text-lg font-medium text-ink mb-1">إضافة طالب جديد ➕</h2>
    <p className="text-sm text-ink-soft mb-4">سيتم ربط الطالب بحسابك تلقائيًا، ولن يظهر للمعلمين الآخرين إلا إذا ربطه المدير بهم أيضًا.</p>
    <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <label className="text-sm text-ink-soft">اسم الطالب<input required value={fullName} onChange={e => setFullName(e.target.value)} className="mt-1 w-full border border-line rounded-md px-3 py-2 bg-paper text-ink" placeholder="الاسم بالكامل" /></label>
      <label className="text-sm text-ink-soft">البريد الإلكتروني<input required type="email" dir="ltr" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 w-full border border-line rounded-md px-3 py-2 bg-paper text-ink text-left" placeholder="student@example.com" /></label>
      <label className="text-sm text-ink-soft">الصف<select value={grade} onChange={e => setGrade(e.target.value)} className="mt-1 w-full border border-line rounded-md px-3 py-2 bg-paper text-ink">{GRADES.map(g => <option key={g} value={g}>{g}</option>)}</select></label>
      <div className="border border-line rounded-md p-3">
        <p className="text-sm text-ink-soft mb-2">كلمة المرور</p>
        <div className="flex flex-wrap gap-4 text-sm text-ink">
          <label><input type="radio" className="ml-1" checked={passwordMode === "random"} onChange={() => setPasswordMode("random")} /> إنشاء تلقائي</label>
          <label><input type="radio" className="ml-1" checked={passwordMode === "manual"} onChange={() => setPasswordMode("manual")} /> أكتبها بنفسي</label>
        </div>
        {passwordMode === "manual" && <div className="flex gap-2 mt-2"><input required minLength={8} type={showPassword ? "text" : "password"} dir="ltr" value={password} onChange={e => setPassword(e.target.value)} className="min-w-0 flex-1 border border-line rounded-md px-3 py-2 bg-paper text-ink" placeholder="8 أحرف على الأقل" /><button type="button" onClick={() => setShowPassword(v => !v)} className="text-xs border border-line rounded-md px-2">{showPassword ? "إخفاء" : "إظهار"}</button></div>}
      </div>
      {error && <p className="sm:col-span-2 text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={loading || (passwordMode === "manual" && password.length < 8)} className="sm:col-span-2 bg-green text-white rounded-md px-4 py-2.5 text-sm font-medium disabled:opacity-60">{loading ? "جاري إنشاء الحساب…" : "إنشاء حساب الطالب وربطه بي"}</button>
    </form>
    {created && <div className="mt-4 rounded-lg border border-green-light bg-paper p-4 text-sm"><p className="font-medium text-green-text mb-2">تم إنشاء الطالب وربطه بحسابك بنجاح. احفظ بيانات الدخول الآن:</p><p dir="ltr" className="text-ink break-all">البريد: {created.email}</p><p dir="ltr" className="text-ink">كلمة المرور: {created.password}</p><button type="button" onClick={() => void navigator.clipboard?.writeText(`البريد: ${created.email}\nكلمة المرور: ${created.password}`)} className="mt-3 border border-line rounded-md px-3 py-1.5 text-xs">نسخ بيانات الدخول</button></div>}
  </section>;
}
