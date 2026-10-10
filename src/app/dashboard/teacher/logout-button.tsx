"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function logout() {
    if (loading) return;
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      setError("تعذر تسجيل الخروج. حاول مرة أخرى.");
      setLoading(false);
      return;
    }
    router.replace("/login");
    router.refresh();
  }

  return <div className="flex flex-col items-end gap-1">
    <button type="button" onClick={logout} disabled={loading} className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-60">
      {loading ? "جارٍ تسجيل الخروج…" : "↩ تسجيل الخروج"}
    </button>
    {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
  </div>;
}
