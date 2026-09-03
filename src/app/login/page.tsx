"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("البريد أو كلمة المرور غير صحيحة.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-10 justify-center">
          <div className="w-7 h-7 rounded-[7px] bg-green" />
          <span className="font-display text-xl font-bold text-ink">أثر</span>
        </div>

        <div className="bg-surface border border-line rounded-xl p-7">
          <h1 className="font-display text-xl font-medium text-ink mb-1">
            تسجيل الدخول
          </h1>
          <p className="text-sm text-ink-soft mb-6">
            استخدم البريد وكلمة المرور اللي أنشأهم لك الأدمن.
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              className="w-full px-3 py-2.5 border border-line rounded-md bg-paper text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-green text-left"
              dir="ltr"
              placeholder="name@school.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              className="w-full px-3 py-2.5 border border-line rounded-md bg-paper text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-green text-left"
              dir="ltr"
              placeholder="كلمة المرور"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green text-white text-sm font-medium py-2.5 rounded-md mt-2 disabled:opacity-60"
            >
              {loading ? "لحظة من فضلك…" : "تسجيل الدخول"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-ink-faint mt-5">
          مفيش تسجيل ذاتي — الحسابات بتتعمل من الأدمن فقط.
        </p>
      </div>
    </div>
  );
}
