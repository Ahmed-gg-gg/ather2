"use client";

import { useState } from "react";
import { GRADES } from "@/lib/grades";

const ROLE_LABELS: Record<string, string> = {
  student: "طالب",
  teacher: "معلم",
  parent: "ولي أمر",
  admin: "أدمن",
};

type StudentOption = { id: string; full_name: string; grade: string | null };

export default function CreateUserForm({
  currentRole,
  students,
}: {
  currentRole: string;
  students: StudentOption[];
}) {
  const availableRoles =
    currentRole === "admin"
      ? (["student", "teacher", "parent", "admin"] as const)
      : (["student", "parent"] as const);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>(availableRoles[0]);
  const [grade, setGrade] = useState(GRADES[0]);
  const [passwordMode, setPasswordMode] = useState<"random" | "manual">(
    "random"
  );
  const [manualPassword, setManualPassword] = useState("");
  const [studentIds, setStudentIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{
    email: string;
    password: string;
  } | null>(null);

  function toggleStudent(id: string) {
    setStudentIds((ids) =>
      ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCreated(null);
    setLoading(true);

    const res = await fetch("/api/admin/create-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName,
        email,
        role,
        grade: role === "student" ? grade : null,
        password: passwordMode === "manual" ? manualPassword : null,
        studentIds: role === "parent" ? studentIds : [],
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "حصل خطأ");
      return;
    }

    setCreated({ email: data.email, password: data.password });
    setFullName("");
    setEmail("");
    setManualPassword("");
    setStudentIds([]);
  }

  return (
    <div className="bg-surface border border-line rounded-xl p-6">
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          className="w-full px-3 py-2.5 border border-line rounded-md bg-paper text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-green"
          placeholder="الاسم بالكامل"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
        <input
          type="email"
          className="w-full px-3 py-2.5 border border-line rounded-md bg-paper text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-green text-left"
          dir="ltr"
          placeholder="name@school.edu"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <select
          className="w-full px-3 py-2.5 border border-line rounded-md bg-paper text-sm text-ink focus:outline-none focus:border-green"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          {Object.entries(ROLE_LABELS)
            .filter(([value]) => availableRoles.includes(value as never))
            .map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
        </select>

        {role === "student" && (
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
        )}

        {role === "parent" && (
          <div className="border border-line rounded-md p-3">
            <p className="text-xs text-ink-soft mb-2">
              اختار الأبناء المرتبطين بولي الأمر ده (اختياري):
            </p>
            <div className="max-h-40 overflow-y-auto space-y-1.5">
              {students.map((s) => (
                <label
                  key={s.id}
                  className="flex items-center gap-2 text-sm text-ink"
                >
                  <input
                    type="checkbox"
                    checked={studentIds.includes(s.id)}
                    onChange={() => toggleStudent(s.id)}
                  />
                  {s.full_name}
                  {s.grade && (
                    <span className="text-xs text-ink-faint">
                      — {s.grade}
                    </span>
                  )}
                </label>
              ))}
              {students.length === 0 && (
                <p className="text-xs text-ink-faint">مفيش طلاب مسجلين لسه.</p>
              )}
            </div>
          </div>
        )}

        <div className="border border-line rounded-md p-3">
          <p className="text-xs text-ink-soft mb-2">كلمة المرور</p>
          <div className="flex items-center gap-3 mb-2">
            <label className="flex items-center gap-1.5 text-sm text-ink">
              <input
                type="radio"
                name="passwordMode"
                checked={passwordMode === "random"}
                onChange={() => setPasswordMode("random")}
              />
              عشوائية
            </label>
            <label className="flex items-center gap-1.5 text-sm text-ink">
              <input
                type="radio"
                name="passwordMode"
                checked={passwordMode === "manual"}
                onChange={() => setPasswordMode("manual")}
              />
              أنا أكتبها
            </label>
          </div>
          {passwordMode === "manual" && (
            <input
              className="w-full px-3 py-2 border border-line rounded-md bg-paper text-sm text-ink text-left"
              dir="ltr"
              placeholder="اكتب كلمة المرور"
              value={manualPassword}
              onChange={(e) => setManualPassword(e.target.value)}
              required={passwordMode === "manual"}
            />
          )}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green text-white text-sm font-medium py-2.5 rounded-md disabled:opacity-60"
        >
          {loading ? "جاري الإنشاء…" : "إنشاء الحساب"}
        </button>
      </form>

      {created && (
        <div className="mt-4 bg-gold-light border border-gold rounded-md p-4 text-sm">
          <p className="text-gold-text font-medium mb-2">
            اتعمل الحساب — ابعت البيانات دي للمستخدم:
          </p>
          <p dir="ltr" className="text-ink font-mono text-xs">
            {created.email}
          </p>
          <p dir="ltr" className="text-ink font-mono text-xs">
            {created.password}
          </p>
        </div>
      )}
    </div>
  );
}
