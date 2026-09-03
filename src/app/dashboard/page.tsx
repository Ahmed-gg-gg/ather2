import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import LogoutButton from "./logout-button";
import LanguageToggle from "@/components/language-toggle";
import { isKidsGrade } from "@/lib/kids-mode";
import { getLang } from "@/lib/i18n/get-lang";
import { translate } from "@/lib/i18n/dictionary";

export default async function DashboardPage(){
  const supabase=await createClient();
  const adminClient=createAdminClient();
  const lang=await getLang();
  const t=(key:Parameters<typeof translate>[0])=>translate(key,lang);
  const{data:{user}}=await supabase.auth.getUser();
  if(!user)redirect('/login');

  // Read the role with the server-only client so an RLS/profile-query issue
  // can never silently turn an admin into the generic student dashboard.
  const{data:profile}=await adminClient.from('profiles').select('full_name,role,grade,onboarding_completed,is_active').eq('id',user.id).single();
  if(profile?.is_active===false)redirect('/login?disabled=1');
  if(profile?.role==='admin')redirect('/dashboard/admin');
  if(profile?.onboarding_completed===false)redirect('/onboarding');
  if(profile?.role==='teacher')redirect('/dashboard/teacher');

  const roleLabelKey:Record<string,Parameters<typeof translate>[0]>={student:'student',teacher:'teacher',parent:'parent',admin:'admin'};
  const kidsMode=profile?.role==='student'&&isKidsGrade(profile?.grade);
  const[{count:attemptCount},{count:unreadCount},{data:gamification}]=await Promise.all([
    supabase.from('quiz_attempts').select('id',{count:'exact',head:true}).eq('user_id',user.id),
    supabase.from('notifications').select('id',{count:'exact',head:true}).eq('user_id',user.id).eq('is_read',false),
    supabase.from('gamification_profiles').select('points,level,streak_days').eq('user_id',user.id).maybeSingle()
  ]);
  return <div className={`min-h-screen ${kidsMode?'kids-bg':'bg-paper'}`} dir={lang==='ar'?'rtl':'ltr'}>
    <div className={kidsMode?'border-b-4 border-[#ffd166] bg-white':'border-b border-line bg-surface'}>
      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2"><div className="w-7 h-7 rounded-[7px] bg-green"/><span className="font-display text-lg font-bold text-ink">{kidsMode?'🌟 ':''}{t('siteName')}</span></div>
        <div className="flex flex-wrap items-center gap-2"><a href="/dashboard/courses" className="text-sm text-ink-soft border border-line rounded-md px-3.5 py-1.5">{t('courses')}</a><a href="/dashboard/results" className="text-sm text-ink-soft border border-line rounded-md px-3.5 py-1.5">النتائج</a><a href="/dashboard/ai" className="text-sm text-green-text border border-line rounded-md px-3.5 py-1.5">🤖 المساعد</a><a href="/dashboard/notifications" className="text-sm text-ink-soft border border-line rounded-md px-3.5 py-1.5">🔔{unreadCount?` ${unreadCount}`:''}</a>{profile?.role==='parent'&&<a href="/dashboard/parent" className="text-sm text-green-text border border-line rounded-md px-3.5 py-1.5">{t('myChildren')}</a>}<LanguageToggle/><LogoutButton label={t('logout')}/></div>
      </div>
    </div>
    <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 sm:py-10">
      <div className="flex items-center justify-between mb-6"><div><h1 className={`font-display text-2xl font-medium ${kidsMode?'text-[#7a3fa0]':'text-ink'}`}>{kidsMode?'🎈 ':''}{t('welcome')}، {profile?.full_name??''}</h1><p className="text-sm text-ink-soft mt-1" dir="ltr">{user.email}</p></div><span className="text-xs font-medium bg-green-light text-green-text px-3 py-1.5 rounded-full">{t(roleLabelKey[profile?.role??'student'])}</span></div>
      {profile?.role!=='admin'&&<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-7"><div className="bg-surface border border-line rounded-xl p-4"><p className="text-xs text-ink-faint">الاختبارات</p><p className="text-2xl font-bold text-ink mt-1">{attemptCount??0}</p></div><a href="/dashboard/gamification" className="bg-surface border border-line rounded-xl p-4"><p className="text-xs text-ink-faint">النقاط ⭐</p><p className="text-2xl font-bold text-ink mt-1">{gamification?.points??0}</p></a><a href="/dashboard/gamification" className="bg-surface border border-line rounded-xl p-4"><p className="text-xs text-ink-faint">المستوى 🎮</p><p className="text-2xl font-bold text-ink mt-1">{gamification?.level??1}</p></a><a href="/dashboard/notifications" className="bg-surface border border-line rounded-xl p-4"><p className="text-xs text-ink-faint">غير مقروء 🔔</p><p className="text-2xl font-bold text-ink mt-1">{unreadCount??0}</p></a></div>}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"><a href="/dashboard/courses" className={kidsMode?'bg-white border-4 border-[#ffd166] rounded-3xl p-6':'bg-surface border border-line rounded-xl p-6'}><h3 className="font-display text-lg font-medium mb-1 text-ink">{kidsMode?'📚 ':''}{t('coursesCardTitle')}</h3><p className="text-sm text-ink-soft">{t('coursesCardDesc')}</p></a><a href="/dashboard/results" className="bg-surface border border-line rounded-xl p-6"><h3 className="font-display text-lg font-medium text-ink mb-1">📊 النتائج والتحليل</h3><p className="text-sm text-ink-soft">راجع نتائج الاختبارات ونقاط التحسين.</p></a><a href="/dashboard/ai" className="bg-surface border border-line rounded-xl p-6"><h3 className="font-display text-lg font-medium text-ink mb-1">🤖 مساعد أثر</h3><p className="text-sm text-ink-soft">تعلّم بالتلميحات أو أنشئ أنشطة تعليمية.</p></a><a href="/dashboard/activity" className="bg-surface border border-line rounded-xl p-6"><h3 className="font-display text-lg font-medium text-ink mb-1">🧾 سجل النشاط</h3><p className="text-sm text-ink-soft">تتبّع ما تم إنجازه داخل المنصة.</p></a>{profile?.role==='parent'&&<a href="/dashboard/parent" className="bg-surface border border-line rounded-xl p-6"><h3 className="font-display text-lg font-medium text-ink mb-1">{t('myChildrenCardTitle')}</h3><p className="text-sm text-ink-soft">{t('myChildrenCardDesc')}</p></a>}</div>
    </div>
  </div>
}