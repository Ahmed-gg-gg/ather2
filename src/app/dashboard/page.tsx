import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "./logout-button";
import LanguageToggle from "@/components/language-toggle";
import { isKidsGrade } from "@/lib/kids-mode";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, grade")
    .eq("id", user.id)
    .single();

  const roleLabel: Record<string, string> = {
    student: "طالب",
    teacher: "معلم",
    parent: "ولي أمر",
    admin: "أدمن",
  };

  const kidsMode =
    profile?.role === "student" && isKidsGrade(profile?.grade);

  return (
    <div className={`min-h-screen ${kidsMode ? "kids-bg" : "bg-paper"}`}>
      <div
        className={
          kidsMode
            ? "border-b-4 border-[#ffd166] bg-white"
            : "border-b border-line bg-surface"
        }
      >
        <div className="max-w-5xl mx-auto px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-[7px] bg-green" />
            <span className="font-display text-lg font-bold text-ink">
              {kidsMode ? "🌟 أثر" : "أثر"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/dashboard/courses"
              className="text-sm text-ink-soft border border-line rounded-md px-3.5 py-1.5"
            >
              الكورسات
            </a>
            {profile?.role === "parent" && (
              <a
                href="/dashboard/parent"
                className="text-sm text-green-text border border-line rounded-md px-3.5 py-1.5"
              >
                متابعة الأبناء
              </a>
            )}
            {["admin", "teacher"].includes(profile?.role ?? "") && (
              <a
                href="/dashboard/admin"
                className="text-sm text-green-text border border-line rounded-md px-3.5 py-1.5"
              >
                إدارة المستخدمين
              </a>
            )}
            <LanguageToggle />
            <LogoutButton />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1
              className={`font-display text-2xl font-medium ${
                kidsMode ? "text-[#7a3fa0]" : "text-ink"
              }`}
            >
              {kidsMode ? "🎈 " : ""}
              أهلًا بيك، {profile?.full_name ?? "بيك"}
            </h1>
            <p className="text-sm text-ink-soft mt-1" dir="ltr">
              {user.email}
            </p>
          </div>
          <span className="text-xs font-medium bg-green-light text-green-text px-3 py-1.5 rounded-full">
            {roleLabel[profile?.role ?? "student"]}
          </span>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <a
            href="/dashboard/courses"
            className={
              kidsMode
                ? "bg-white border-4 border-[#ffd166] rounded-3xl p-6 hover:border-[#ff8fab] transition-colors"
                : "bg-surface border border-line rounded-xl p-6 hover:border-green transition-colors"
            }
          >
            <h3
              className={`font-display text-lg font-medium mb-1 ${
                kidsMode ? "text-[#7a3fa0]" : "text-ink"
              }`}
            >
              {kidsMode ? "📚 الكورسات" : "الكورسات"}
            </h3>
            <p className="text-sm text-ink-soft">
              {kidsMode
                ? "يلا نتفرج على الدروس ونحل الكويزات المرحة!"
                : "اتفرج على الدروس والفيديوهات وحل الكويزات."}
            </p>
          </a>

          {profile?.role === "parent" && (
            <a
              href="/dashboard/parent"
              className="bg-surface border border-line rounded-xl p-6 hover:border-green transition-colors"
            >
              <h3 className="font-display text-lg font-medium text-ink mb-1">
                متابعة الأبناء
              </h3>
              <p className="text-sm text-ink-soft">
                شوف درجات أبنائك في كل الكويزات في مكان واحد.
              </p>
            </a>
          )}

          {["admin", "teacher"].includes(profile?.role ?? "") && (
            <a
              href="/dashboard/admin/courses"
              className="bg-surface border border-line rounded-xl p-6 hover:border-green transition-colors"
            >
              <h3 className="font-display text-lg font-medium text-ink mb-1">
                إدارة الكورسات
              </h3>
              <p className="text-sm text-ink-soft">
                أضف كورسات ودروس وكويزات، وشوف نتائج الطلاب.
              </p>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
