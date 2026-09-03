import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-6">
      <div className="text-center max-w-md">
        <div className="flex items-center gap-2 justify-center mb-6">
          <div className="w-8 h-8 rounded-[8px] bg-green" />
          <span className="font-display text-2xl font-bold text-ink">
            أثر
          </span>
        </div>
        <h1 className="font-display text-3xl font-medium text-ink mb-3">
          حيث يبقى للتعليم أثر حقيقي
        </h1>
        <p className="text-ink-soft text-sm mb-8">
          الكورسات، الحصص المباشرة، الدرجات، ومتابعة التقدم في مكان واحد.
        </p>
        <Link
          href="/login"
          className="inline-block bg-green text-white text-sm font-medium px-6 py-2.5 rounded-md"
        >
          تسجيل الدخول / إنشاء حساب
        </Link>
      </div>
    </div>
  );
}
