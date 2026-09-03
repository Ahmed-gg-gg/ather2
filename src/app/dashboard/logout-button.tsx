"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LogoutButton({ label }: { label?: string }) {
  const router = useRouter();
  const supabase = createClient();

  return (
    <button
      className="text-sm text-ink-soft border border-line rounded-md px-3.5 py-1.5"
      onClick={async () => {
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
      }}
    >
      {label ?? "تسجيل الخروج"}
    </button>
  );
}
