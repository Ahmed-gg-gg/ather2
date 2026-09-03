import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import BackButton from '@/components/back-button';

type Profile={full_name:string|null;grade:string|null};
type Row={user_id:string;points:number;level:number;streak_days:number;profiles?:Profile|Profile[]|null};
const profileName=(profiles:Row['profiles'])=>Array.isArray(profiles)?profiles[0]?.full_name??'طالب':profiles?.full_name??'طالب';

export default async function GamificationPage(){
  const supabase=await createClient();
  const{data:{user}}=await supabase.auth.getUser();
  if(!user)redirect('/login');

  const{data:profile}=await supabase.from('profiles').select('role').eq('id',user.id).maybeSingle();
  if(profile?.role!=='student') redirect(profile?.role==='admin'?'/dashboard/admin':'/dashboard/teacher');

  const{data:stats}=await supabase.from('gamification_profiles').select('points,level,streak_days').eq('user_id',user.id).maybeSingle();
  const{data:badges}=await supabase.from('user_badges').select('earned_at,badges(name,description,icon)').eq('user_id',user.id).order('earned_at',{ascending:false});
  const{data:leaders}=await supabase.from('gamification_profiles').select('user_id,points,level,streak_days,profiles!inner(full_name,grade,role)').eq('profiles.role','student').order('points',{ascending:false}).limit(20);
  const points=stats?.points??0;
  const level=stats?.level??1;
  const next=level*100;
  const progress=Math.min(100,Math.round((points-(level-1)*100)/100*100));

  return <div className="min-h-screen bg-paper"><div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10"><div className="mb-4"><BackButton/></div><h1 className="font-display text-2xl font-medium text-ink mb-1">إنجازاتي 🏆</h1><p className="text-sm text-ink-soft mb-7">كل اختبار تكمله يضيف نقاطًا إلى مستواك.</p><div className="grid sm:grid-cols-3 gap-3"><div className="bg-surface border border-line rounded-xl p-5"><span className="text-2xl">⭐</span><p className="text-2xl font-bold text-ink mt-2">{points}</p><p className="text-xs text-ink-faint">نقطة</p></div><div className="bg-surface border border-line rounded-xl p-5"><span className="text-2xl">🎮</span><p className="text-2xl font-bold text-ink mt-2">{level}</p><p className="text-xs text-ink-faint">المستوى</p></div><div className="bg-surface border border-line rounded-xl p-5"><span className="text-2xl">🔥</span><p className="text-2xl font-bold text-ink mt-2">{stats?.streak_days??0}</p><p className="text-xs text-ink-faint">يوم متتالٍ</p></div></div><div className="bg-surface border border-line rounded-xl p-5 mt-5"><div className="flex justify-between text-sm"><span>التقدم للمستوى {level+1}</span><span>{points}/{next}</span></div><div className="h-3 bg-paper rounded-full mt-3 overflow-hidden"><div className="h-full bg-green rounded-full" style={{width:`${progress}%`}}/></div></div><div className="mt-8"><h2 className="font-display text-lg text-ink mb-3">المتصدرون 🥇</h2><div className="bg-surface border border-line rounded-xl overflow-hidden"><div className="grid grid-cols-[48px_1fr_80px_80px] gap-2 px-4 py-3 text-xs text-ink-faint border-b border-line"><span>#</span><span>الطالب</span><span>المستوى</span><span>النقاط</span></div>{(leaders as Row[]??[]).map((r,i)=><div key={r.user_id} className={`grid grid-cols-[48px_1fr_80px_80px] gap-2 px-4 py-3 items-center border-b border-line last:border-0 ${r.user_id===user.id?'bg-paper':''}`}><span className="font-bold">{i<3?['🥇','🥈','🥉'][i]:i+1}</span><span className="text-sm text-ink truncate">{profileName(r.profiles)}</span><span className="text-sm text-ink">{r.level}</span><span className="text-sm font-bold text-ink">{r.points}</span></div>)}{(!leaders||leaders.length===0)&&<p className="p-5 text-sm text-ink-faint">لا توجد نتائج بعد.</p>}</div></div><div className="mt-8"><h2 className="font-display text-lg text-ink mb-3">الشارات</h2><div className="grid sm:grid-cols-2 gap-3">{(badges??[]).map((b:any)=><div key={b.earned_at+b.badges?.name} className="bg-surface border border-line rounded-xl p-4 flex gap-3"><span className="text-3xl">{b.badges?.icon??'🏅'}</span><div><p className="font-medium text-ink">{b.badges?.name}</p><p className="text-xs text-ink-soft mt-1">{b.badges?.description}</p></div></div>)}{(badges??[]).length===0&&<p className="text-sm text-ink-faint">أكمل أول اختبار لتحصل على أول شارة.</p>}</div></div></div></div>;
}
