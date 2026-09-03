"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import BackButton from "@/components/back-button";

type Student = { id: string; full_name: string; grade: string | null };
type Group = { id: string; name: string; grade: string | null; members: { user_id: string }[] };

export default function GroupsPage() {
  const supabase = createClient();
  const [students, setStudents] = useState<Student[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [name, setName] = useState("");
  const [grade, setGrade] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const [{ data: s }, { data: g }] = await Promise.all([
      supabase.from("profiles").select("id, full_name, grade").eq("role", "student").order("full_name"),
      supabase.from("account_groups").select("id, name, grade, account_group_members(user_id)").order("created_at", { ascending: false }),
    ]);
    setStudents((s ?? []) as Student[]); setGroups((g ?? []) as Group[]); setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => grade ? students.filter((s) => s.grade === grade) : students, [students, grade]);
  const grades = [...new Set(students.map((s) => s.grade).filter(Boolean))] as string[];

  async function createGroup() {
    if (!name.trim() || !selected.length) { setMessage("اكتب اسم المجموعة واختر طالبًا واحدًا على الأقل."); return; }
    const { data: group, error } = await supabase.from("account_groups").insert({ name: name.trim(), grade: grade || null }).select().single();
    if (error || !group) { setMessage(error?.message ?? "تعذر إنشاء المجموعة."); return; }
    const { error: membersError } = await supabase.from("account_group_members").insert(selected.map((user_id) => ({ group_id: group.id, user_id })));
    if (membersError) { setMessage(membersError.message); return; }
    setName(""); setSelected([]); setMessage("تم إنشاء المجموعة بنجاح."); await load();
  }

  async function deleteGroup(id: string) {
    if (!confirm("حذف المجموعة؟ لن يتم حذف حسابات الطلاب.")) return;
    const { error } = await supabase.from("account_groups").delete().eq("id", id);
    setMessage(error ? error.message : "تم حذف المجموعة."); if (!error) await load();
  }

  return <div className="min-h-screen bg-paper"><div className="max-w-4xl mx-auto px-6 py-10"><div className="mb-4"><BackButton /></div><h1 className="font-display text-2xl font-medium text-ink">المجموعات والفصول</h1><p className="text-sm text-ink-soft mt-1 mb-7">قسّم الطلاب إلى Grid / فصول واعرض عدد الطلاب ودرجاتهم.</p>
    <div className="bg-surface border border-line rounded-xl p-5 space-y-4"><input value={name} onChange={(e)=>setName(e.target.value)} placeholder="اسم المجموعة — مثال: Grid 4" className="w-full border border-line rounded-md px-3 py-2 bg-paper text-sm"/><select value={grade} onChange={(e)=>setGrade(e.target.value)} className="w-full border border-line rounded-md px-3 py-2 bg-paper text-sm"><option value="">كل الصفوف</option>{grades.map(g=><option key={g} value={g}>{g}</option>)}</select><div className="max-h-64 overflow-auto border border-line rounded-md">{filtered.map(s=><label key={s.id} className="flex items-center gap-3 px-3 py-2 border-b border-line last:border-0 text-sm"><input type="checkbox" checked={selected.includes(s.id)} onChange={(e)=>setSelected((a)=>e.target.checked?[...a,s.id]:a.filter(id=>id!==s.id))}/><span>{s.full_name}</span><span className="text-xs text-ink-faint">{s.grade ?? "بدون صف"}</span></label>)}</div><button onClick={createGroup} className="bg-green text-white rounded-md px-5 py-2 text-sm font-medium">إنشاء المجموعة ({selected.length} طالب)</button>{message&&<p className="text-sm text-ink-soft">{message}</p>}</div>
    <div className="mt-8 space-y-3">{loading?<p className="text-sm text-ink-faint">جاري التحميل…</p>:groups.map(g=><div key={g.id} className="bg-surface border border-line rounded-xl p-5 flex items-center justify-between"><div><h2 className="font-medium text-ink">{g.name}</h2><p className="text-xs text-ink-faint mt-1">{g.grade ?? "كل الصفوف"} · {g.members?.length ?? 0} طالب</p></div><button onClick={()=>deleteGroup(g.id)} className="text-xs text-red-600 border border-line rounded-md px-3 py-1.5">حذف</button></div>)}</div>
  </div></div>;
}
