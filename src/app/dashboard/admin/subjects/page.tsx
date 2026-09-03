import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BackButton from "@/components/back-button";
import SubjectsManager from "./subjects-manager";

export default async function AdminSubjectsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!["admin", "teacher"].includes(profile?.role ?? "")) redirect("/dashboard");

  const { data: subjects } = await supabase
    .from("subjects")
    .select("id, name, language")
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-paper">
      <div className="max-w-3xl mx-auto px-8 py-10">
        <div className="mb-4">
          <BackButton />
        </div>
        <h1 className="font-display text-2xl font-medium text-ink mb-1">
          المواد الدراسية
        </h1>
        <p className="text-sm text-ink-soft mb-8">
          أضف أو احذف المواد اللي هتظهر لما تعمل كورس جديد.
        </p>

        <SubjectsManager initialSubjects={subjects ?? []} />
      </div>
    </div>
  );
}
