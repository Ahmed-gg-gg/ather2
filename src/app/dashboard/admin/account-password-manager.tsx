"use client";

import { useMemo, useState } from "react";

type Account = { id: string; full_name: string; email: string; role: string };

const roles: Record<string, string> = { admin: "مدير", teacher: "معلم", student: "طالب", parent: "ولي أمر" };

export default function AccountPasswordManager({ accounts }: { accounts: Account[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Account | null>(null);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const matches = useMemo(() => {
    const q = query.trim().toLocaleLowerCase();
    if (!q) return [];
    return accounts.filter(a => (a.full_name || "").toLocaleLowerCase().includes(q) || (a.email || "").toLocaleLowerCase().includes(q)).slice(0, 8);
  }, [accounts, query]);

  async function resetPassword() {
    if (!selected) return;
    if (!window.confirm(`سيتم تعيين كلمة مرور جديدة لحساب ${selected.full_name}. هل تريد المتابعة؟`)) return;
    setBusy(true); setError(""); setPassword(""); setCopied(false);
    try {
      const response = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selected.id }),
      });
      const data = await response.json();
      if (!response.ok) { setError(data.error || "تعذر تغيير كلمة المرور."); return; }
      setPassword(data.password);
    } catch {
      setError("تعذر الاتصال بالخادم. حاول مرة أخرى.");
    } finally {
      setBusy(false);
    }
  }

  async function copyPassword() {
    if (!selected || !password) return;
    try {
      await navigator.clipboard.writeText(`الاسم: ${selected.full_name}\nالبريد: ${selected.email}\nكلمة المرور الجديدة: ${password}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch { setError("تعذر النسخ تلقائيًا."); }
  }

  return <>
    <button type="button" onClick={() => { setOpen(true); setSelected(null); setPassword(""); setQuery(""); setError(""); }} className="rounded-xl border border-[#c4b5fd] bg-[#f5f3ff] px-4 py-2.5 text-sm font-bold text-[#6d28d9] hover:bg-[#ede9fe]">🔐 كلمات مرور الحسابات</button>
    {open && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4" role="dialog" aria-modal="true" aria-labelledby="password-manager-title">
      <div className="w-full max-w-lg rounded-3xl border-2 border-[#ddd6fe] bg-white p-5 shadow-2xl sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div><h2 id="password-manager-title" className="text-xl font-extrabold text-[#5b21b6]">🔐 بيانات الحساب</h2><p className="mt-1 text-sm leading-6 text-slate-500">ابحث باسم المستخدم أو البريد الإلكتروني.</p></div>
          <button type="button" onClick={() => setOpen(false)} className="rounded-full bg-slate-100 px-3 py-1.5 text-sm text-slate-600" aria-label="إغلاق">✕</button>
        </div>
        <input autoFocus value={query} onChange={e => { setQuery(e.target.value); setSelected(null); setPassword(""); }} placeholder="اكتب اسم الطالب أو البريد الإلكتروني…" className="w-full rounded-2xl border-2 border-[#ddd6fe] bg-[#fafaff] px-4 py-3 text-sm outline-none focus:border-[#8b5cf6]" />
        {!selected && query.trim() && <div className="mt-2 max-h-52 space-y-1 overflow-y-auto rounded-2xl border border-slate-100 p-2">
          {matches.map(a => <button key={a.id} type="button" onClick={() => { setSelected(a); setPassword(""); setError(""); }} className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-right hover:bg-[#f5f3ff]">
            <span className="min-w-0"><span className="block truncate text-sm font-bold text-slate-700">{a.full_name || "حساب بدون اسم"}</span><span dir="ltr" className="block break-all text-left text-xs text-slate-500">{a.email}</span></span><span className="shrink-0 rounded-full bg-[#ede9fe] px-2 py-1 text-xs text-[#6d28d9]">{roles[a.role] || a.role}</span>
          </button>)}
          {matches.length === 0 && <p className="p-3 text-sm text-slate-500">مفيش حساب مطابق للبحث.</p>}
        </div>}
        {selected && <div className="mt-4 rounded-2xl border-2 border-[#bfdbfe] bg-[#eff6ff] p-4">
          <p className="text-xs font-bold text-[#1d4ed8]">الحساب المحدد</p><p className="mt-1 font-bold text-slate-800">{selected.full_name}</p><p dir="ltr" className="mt-1 break-all text-left text-sm text-slate-600">{selected.email}</p>
          <p className="mt-3 rounded-xl bg-white/80 p-3 text-xs leading-5 text-slate-600">لا يمكن عرض كلمة المرور القديمة لأنها محفوظة بشكل مشفّر لا يسمح باسترجاعها. يمكنك تعيين كلمة مرور جديدة وعرضها هنا.</p>
          {password && <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3"><p className="text-xs font-bold text-emerald-800">كلمة المرور الجديدة</p><p dir="ltr" className="mt-1 break-all font-mono text-base font-bold text-slate-800">{password}</p><button type="button" onClick={copyPassword} className="mt-3 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white">{copied ? "✓ تم النسخ بنجاح" : "📋 نسخ بيانات الدخول"}</button></div>}
          <button type="button" onClick={resetPassword} disabled={busy} className="mt-3 w-full rounded-2xl bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] px-4 py-3 text-sm font-extrabold text-white disabled:opacity-50">{busy ? "جارٍ تغيير كلمة المرور…" : password ? "توليد كلمة مرور جديدة مرة أخرى" : "تغيير كلمة المرور"}</button>
        </div>}
        {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
        <p className="mt-4 text-xs leading-5 text-slate-400">تغيير كلمة المرور يسري فورًا، وسيتعين على المستخدم تسجيل الدخول بكلمة المرور الجديدة.</p>
      </div>
    </div>}
  </>;
}
