'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function OnboardingPage(){
 const router=useRouter(); const supabase=createClient();
 const [loading,setLoading]=useState(false);
 async function choose(role:'student'|'teacher'){
  setLoading(true);
  const {data:{user}}=await supabase.auth.getUser();
  if(user) await supabase.from('profiles').update({onboarding_completed:true}).eq('id',user.id);
  router.push(role==='teacher'?'/dashboard/teacher':'/dashboard'); router.refresh();
 }
 return <main className="min-h-screen bg-paper flex items-center justify-center px-5" dir="rtl"><section className="w-full max-w-2xl"><div className="text-center mb-8"><div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-green flex items-center justify-center text-white text-2xl font-bold">أ</div><p className="text-sm text-green-text font-medium mb-2">أثر</p><h1 className="font-display text-3xl sm:text-4xl font-medium text-ink">هل تريد تجربة أثر؟ ✨</h1><p className="text-ink-soft mt-3">اختر طريقة استخدامك للمنصة لنجهز لك التجربة المناسبة.</p></div><div className="grid sm:grid-cols-2 gap-4"><button disabled={loading} onClick={()=>choose('student')} className="text-right bg-surface border border-line rounded-2xl p-6 hover:border-green hover:-translate-y-0.5 transition disabled:opacity-60"><div className="text-3xl mb-4">🎓</div><h2 className="font-display text-xl text-ink mb-2">أنا طالب</h2><p className="text-sm text-ink-soft">الدروس، الاختبارات، النقاط، الشارات، والمساعد الذكي للتعلّم.</p></button><button disabled={loading} onClick={()=>choose('teacher')} className="text-right bg-surface border border-line rounded-2xl p-6 hover:border-green hover:-translate-y-0.5 transition disabled:opacity-60"><div className="text-3xl mb-4">👨‍🏫</div><h2 className="font-display text-xl text-ink mb-2">أنا معلم</h2><p className="text-sm text-ink-soft">إدارة الطلاب، إنشاء الاختبارات، تحليل النتائج، وخطة دعم ذكية.</p></button></div></section></main>;
}
