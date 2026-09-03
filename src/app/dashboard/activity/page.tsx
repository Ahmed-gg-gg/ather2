import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import BackButton from "@/components/back-button";

export default async function ActivityPage(){
 const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user)redirect('/login');
 const {data:profile}=await supabase.from('profiles').select('role').eq('id',user.id).single();
 const privileged=['admin','teacher'].includes(profile?.role??''); const db=privileged?createAdminClient():supabase;
 const {data:events}=await db.from('activity_log').select('id,user_id,actor_id,action,entity_type,details,created_at').order('created_at',{ascending:false}).limit(200);
 const ids=[...new Set((events??[]).map(e=>e.user_id).filter(Boolean))]; const {data:profiles}=privileged&&ids.length?await db.from('profiles').select('id,full_name').in('id',ids):{data:[]}; const names=new Map((profiles??[]).map(p=>[p.id,p.full_name]));
 const label=(action:string)=>({quiz_completed:'أكمل اختبارًا',login:'سجّل الدخول',profile_updated:'حدّث الملف الشخصي',group_joined:'انضم إلى مجموعة'}[action]??action);
 return <div className="min-h-screen bg-paper"><div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10"><div className="mb-4"><BackButton/></div><h1 className="font-display text-2xl font-medium text-ink">سجل النشاط 🧾</h1><p className="text-sm text-ink-soft mt-1 mb-7">آخر الأنشطة المسجلة في أثر.</p><div className="bg-surface border border-line rounded-xl divide-y divide-line">{(events??[]).map(e=><div key={e.id} className="p-4 flex items-start gap-3"><div className="w-9 h-9 rounded-full bg-green-light flex items-center justify-center">✓</div><div className="flex-1"><p className="text-sm text-ink">{privileged?(names.get(e.user_id)??'مستخدم'):'أنت'} — {label(e.action)}</p><p className="text-xs text-ink-faint mt-1">{new Date(e.created_at).toLocaleString('ar-EG')} {e.details?.score!==undefined?` · النتيجة ${String(e.details.score)}/${String(e.details.total??'')}`:''}</p></div></div>)}{(events??[]).length===0&&<p className="p-8 text-center text-sm text-ink-faint">لا يوجد نشاط مسجل بعد.</p>}</div></div></div>;
}
