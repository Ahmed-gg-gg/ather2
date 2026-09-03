"use client";

import { useRouter } from "next/navigation";

export default function BackButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className="text-sm text-ink-soft border border-line rounded-md px-3.5 py-1.5 flex items-center gap-1.5"
    >
      <span>→</span>
      رجوع
    </button>
  );
}
