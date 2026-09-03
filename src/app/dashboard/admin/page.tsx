import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import CreateUserForm from "./create-user-form";
import UsersList from "./users-list";
import BackButton from "@/components/back-button";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!["admin", "teacher"].includes(profile?.role ?? "")) redirect("/dashboard");
  const [{ data: users }, { data: authUsers }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, role, grade, created_at").order("created_at", { ascending: false }),
    createAdminClient().auth.admin.listUsers({ perPage: 1000 }),
  ]);
  const emailById = new Map((authUsers?.users ?? []).map((u) => [u.id, u.email ?? ""]));
  const enrichedUsers = (users ?? []).map((u) => ({ ...u, email: emailById.get(u.id) ?? "" }));
  const students = (users ?? []).filter((u) => u.role === "student").map((u) => ({ id: u.id, full_name: u.full_name, grade: u.grade }));
  return <div className="min-h-screen bg-paper"><div className="max-w-3xl mx-auto px-8 py-10"><div className="mb-4"><BackButton /></div><h1 className="font-display text-2xl font-medium text-ink mb-1">إدارة المستخدمين</h1><p className="text-sm text-ink-soft mb-8">إدارة الحسابات والمجموعات والكورسات من مكان واحد.</p><div className="flex flex-wrap items-center gap-2 mb-8"><a href="/dashboard/admin/courses" className="text-sm text-green-text border border-line rounded-md px-3.5 py-1.5">إدارة الكورسات</a><a href="/dashboard/admin/groups" className="text-sm text-green-text border border-line rounded-md px-3.5 py-1.5">المجموعات والدرجات</a></div><CreateUserForm currentRole={profile?.role ?? "teacher"} students={students} /><UsersList users={enrichedUsers} currentUserId={user.id} currentRole={profile?.role ?? "teacher"} /></div></div>;
}
