"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type UserRow = { id: string; full_name: string; role: string; grade: string | null; created_at: string; email?: string };
const ROLE_LABELS: Record<string, string> = { student: "طالب", teacher: "معلم", parent: "ولي أمر", admin: "أدمن" };

export default function UsersList({ users, currentUserId, currentRole }: { users: UserRow[]; currentUserId: string; currentRole: string }) {
  const router = useRouter(); const [confirmingId, setConfirmingId] = useState<string | null>(null); const [deletingId, setDeletingId] = useState<string | null>(null); const [error, setError] = useState<string | null>(null);
  async function handleDelete(userId: string) { setDeletingId(userId); setError(null); const res = await fetch("/api/admin/delete-user", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({userId}) }); const data=await res.json(); setDeletingId(null); setConfirmingId(null); if(!res.ok){setError(data.error??"حصل خطأ");return;} router.refresh(); }
  function canDelete(u: UserRow) { if(u.id===currentUserId)return false; if(currentRole==="admin")return true; return ["student","parent"].includes(u.role); }
  return <div className="bg-surface border border-line rounded-xl mt-10 overflow-hidden"><div className="px-5 py-3.5 border-b border-line text-sm font-medium text-ink">المستخدمين الحاليين</div>{error&&<p className="px-5 py-2 text-sm text-red-600 border-b border-line">{error}</p>}{users.map(u=><div key={u.id} className="px-5 py-3 border-b border-line last:border-0 flex items-center justify-between gap-4 text-sm"><div className="min-w-0"><p className="text-ink">{u.full_name}<span className="text-xs text-ink-faint mr-2">{u.grade?`— ${u.grade}`:""}</span></p>{u.email&&<p className="text-xs text-green-text mt-0.5 break-all">{u.email}</p>}</div><div className="flex items-center gap-2 shrink-0"><span className="text-xs bg-green-light text-green-text px-2.5 py-1 rounded-full">{ROLE_LABELS[u.role]}</span>{canDelete(u)&&(confirmingId===u.id?<div className="flex items-center gap-1.5"><button onClick={()=>handleDelete(u.id)} disabled={deletingId===u.id} className="text-xs bg-red-600 text-white px-2.5 py-1 rounded-md disabled:opacity-60">{deletingId===u.id?"جاري الحذف…":"تأكيد الحذف"}</button><button onClick={()=>setConfirmingId(null)} className="text-xs text-ink-soft px-2 py-1">إلغاء</button></div>:<button onClick={()=>setConfirmingId(u.id)} className="text-xs text-red-600 border border-line rounded-md px-2.5 py-1">حذف</button>)}</div></div>)}</div>;
}
