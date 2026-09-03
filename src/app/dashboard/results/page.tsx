import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import BackButton from "@/components/back-button";

type Attempt={id:string;quiz_id:string;user_id:string;score:number;total:number;duration_seconds:number|null;created_at:string;answers:Record<string,unknown>|null};
type Question={id:string;quiz_id:string;question:string;question_type:string;correct_index:number;correct_answer:string|null;options:unknown};

function correct(q:Question, answer:unknown){
  if(q.question_type==="complete") return String(answer??"").trim().toLocaleLowerCase()===String(q.correct_answer??"").trim().toLocaleLowerCase();
  if(q.question_type==="numerical") return Number(answer)===Number(q.correct_answer);
  if(q.question_type==="multiple_select") { try { const expected=JSON.parse(q.correct_answer??"[]") as number[]; const actual=Array.isArray(answer)?answer as number[]:[]; return expected.length===actual.length&&expected.every(x=>actual.includes(x)); } catch { return false; } }
  return Number(answer)===q.correct_index;
}

export default async function ResultsPage(){
  const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user) redirect("/login");
  const {data:profile}=await supabase.from("profiles").select("full_name,role").eq("id",user.id).single();
  const privileged=["admin","teacher"].includes(profile?.role??""); const db=privileged?createAdminClient():supabase;
  const {data:attempts}=await db.from("quiz_attempts").select("id,quiz_id,user_id,score,total,duration_seconds,created_at,answers").order("created_at",{ascending:false}).limit(300);
  const visibleAttempts=(privileged?attempts??( [] as Attempt[]):(attempts??[]).filter(a=>a.user_id===user.id)) as Attempt[];
  const quizIds=[...new Set(visibleAttempts.map(a=>a.quiz_id))];
  const [{data:quizzes},{data:profiles},{data:questions}]=await Promise.all([
    quizIds.length?db.from("quizzes").select("id,title").in("id",quizIds):Promise.resolve({data:[]}),
    privileged?db.from("profiles").select("id,full_name,grade").in("id",[...new Set(visibleAttempts.map(a=>a.user_id))]):Promise.resolve({data:[]}),
    quizIds.length?db.from("quiz_questions").select("id,quiz_id,question,question_type,correct_index,correct_answer,options").in("quiz_id",quizIds):Promise.resolve({data:[]})
  ]);
  const quizMap=new Map((quizzes??[]).map(q=>[q.id,q.title])); const profileMap=new Map((profiles??[]).map(p=>[p.id,p]));
  const qs=(questions??[]) as Question[]; const questionMap=new Map(qs.map(q=>[q.id,q])); const analysis=new Map<string,{wrong:number;answered:number;total:number}>();
  for(const a of visibleAttempts){for(const q of qs.filter(q=>q.quiz_id===a.quiz_id)){const raw=a.answers?.[q.id]; if(raw===undefined)continue; const x=analysis.get(q.id)??{wrong:0,answered:0,total:0}; x.answered++; x.total++; if(!correct(q,raw))x.wrong++; analysis.set(q.id,x);}}
  const avg=visibleAttempts.length?Math.round(visibleAttempts.reduce((s,a)=>s+(a.total?100*a.score/a.total:0),0)/visibleAttempts.length):0;
  return <div className="min-h-screen bg-paper"><div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10"><div className="mb-4"><BackButton/></div><div className="flex flex-wrap items-end justify-between gap-3 mb-7"><div><h1 className="font-display text-2xl font-medium text-ink">النتائج والتحليل 📊</h1><p className="text-sm text-ink-soft mt-1">نتائج الاختبارات ونسبة النجاح وتحليل الأسئلة.</p></div><div className="flex gap-2"><span className="text-xs bg-green-light text-green-text px-3 py-1.5 rounded-full">{visibleAttempts.length} محاولة</span><span className="text-xs bg-surface border border-line px-3 py-1.5 rounded-full">متوسط {avg}%</span></div></div>
  <div className="overflow-x-auto bg-surface border border-line rounded-xl"><table className="w-full text-sm"><thead><tr className="border-b border-line text-ink-soft"><th className="text-right p-3">الطالب</th><th className="text-right p-3">الاختبار</th><th className="text-right p-3">النتيجة</th><th className="text-right p-3">النسبة</th><th className="text-right p-3">الوقت</th><th className="text-right p-3">الحالة</th></tr></thead><tbody>{visibleAttempts.map(a=>{const pct=a.total?Math.round(100*a.score/a.total):0;return <tr key={a.id} className="border-b border-line last:border-0"><td className="p-3 text-ink">{profileMap.get(a.user_id)?.full_name??(a.user_id===user.id?profile?.full_name:"طالب")}</td><td className="p-3 text-ink-soft">{quizMap.get(a.quiz_id)??"اختبار"}</td><td className="p-3">{a.score}/{a.total}</td><td className="p-3 font-medium">{pct}%</td><td className="p-3 text-ink-faint">{a.duration_seconds?`${Math.floor(a.duration_seconds/60)}د ${a.duration_seconds%60}ث`:"—"}</td><td className="p-3"><span className={`text-xs px-2 py-1 rounded-full ${pct>=50?"bg-green-light text-green-text":"bg-red-50 text-red-700"}`}>{pct>=50?"ناجح":"يحتاج مراجعة"}</span></td></tr>})}</tbody></table>{visibleAttempts.length===0&&<p className="p-8 text-center text-sm text-ink-faint">لا توجد نتائج بعد.</p>}</div>
  {privileged&&<div className="mt-8 bg-surface border border-line rounded-xl p-5"><h2 className="font-display text-lg text-ink mb-1">تحليل الأسئلة</h2><p className="text-xs text-ink-faint mb-4">النسبة هنا مبنية على المحاولات الجديدة التي تحفظ إجابات كل سؤال.</p><div className="space-y-3">{qs.map(q=>{const x=analysis.get(q.id);const wrongPct=x?.answered?Math.round(100*x.wrong/x.answered):0;return <div key={q.id} className="border border-line rounded-lg p-3"><div className="flex justify-between gap-3"><span className="text-sm text-ink">{q.question}</span><span className="text-xs text-ink-soft">{x?.answered??0} إجابة · {wrongPct}% خطأ</span></div><div className="mt-2 h-2 bg-paper rounded-full overflow-hidden"><div className="h-full bg-red-400" style={{width:`${wrongPct}%`}}/></div></div>})}</div></div>}
  </div></div>;
}
