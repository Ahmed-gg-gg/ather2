"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type QuestionType = "multiple_choice" | "multiple_select" | "complete" | "numerical" | "true_false" | "matching" | "ordering" | "image" | "audio" | "reading";
type Question = { id:string; question:string; options:string[]; correctIndex:number; correctAnswer?:string|null; points?:number; explanation?:string|null; time_limit_seconds?:number|null; media_url?:string|null; media_type?:string|null; reading_passage?:string|null; type:QuestionType };
type Attempt={score:number;total:number};
type Answer=string|number|number[]|Record<string,number>;
type Review=Record<string,boolean>;

function parseNumbers(value:string|null|undefined,fallback:number[]=[]){try{const parsed=JSON.parse(value??"");return Array.isArray(parsed)?parsed.map(Number):fallback;}catch{return fallback;}}
function parseMap(value:string|null|undefined){try{const parsed=JSON.parse(value??"");return parsed&&typeof parsed==="object"&&!Array.isArray(parsed)?parsed as Record<string,number>:{};}catch{return {};}}
function correctAnswerText(q:Question){
 if(q.type==="multiple_select")return parseNumbers(q.correctAnswer).map(i=>q.options[i]??"").filter(Boolean).join("، ");
 if(q.type==="matching"){const m=parseMap(q.correctAnswer);return Object.keys(m).map(k=>{const left=(q.options[Number(k)]??"").split("=")[0]?.trim()??"";const pair=(q.options[Number(k)]??"").split("=");const right=(q.options[m[k]]??"").split("=").slice(1).join("=").trim();return `${left} ← ${right||pair.slice(1).join("=").trim()}`}).join("، ");}
 if(q.type==="ordering")return parseNumbers(q.correctAnswer,q.options.map((_,i)=>i)).map(i=>q.options[i]??"").join(" → ");
 if(q.type==="complete"||q.type==="numerical")return String(q.correctAnswer??q.options[0]??"");
 return q.options[q.correctIndex]??"";
}

export default function QuizPlayer({quizId,title,questions,attempts:initialAttempts,maxAttempts,kidsMode}:{quizId:string;title:string;questions:Question[];attempts:Attempt[];maxAttempts:number|null;kidsMode:boolean}){
 const supabase=createClient();
 const startedAt=useRef(Date.now());
 const [answers,setAnswers]=useState<Record<string,Answer>>({});
 const [attempts,setAttempts]=useState(initialAttempts);
 const [retrying,setRetrying]=useState(initialAttempts.length===0);
 const [submitting,setSubmitting]=useState(false);
 const [error,setError]=useState<string|null>(null);
 const [review,setReview]=useState<Review|null>(null);
 const [result,setResult]=useState<{score:number;total:number;duration:number}|null>(null);
 const [remaining,setRemaining]=useState<Record<string,number>>(()=>Object.fromEntries(questions.filter(q=>q.time_limit_seconds&&q.time_limit_seconds>0).map(q=>[q.id,Math.ceil(q.time_limit_seconds!)])));
 const [expired,setExpired]=useState<string[]>([]);
 const canRetry=maxAttempts===null||attempts.length<maxAttempts;
 const best=attempts.reduce<Attempt|null>((b,a)=>!b||a.score/a.total>b.score/b.total?a:b,null);

 useEffect(()=>{if(!retrying)return;const timer=window.setInterval(()=>{setRemaining(prev=>{const next={...prev};const justExpired:string[]=[];for(const q of questions){const value=prev[q.id];if(value===undefined||value<=0||expired.includes(q.id))continue;next[q.id]=value-1;if(value===1)justExpired.push(q.id);}if(justExpired.length){setExpired(old=>[...new Set([...old,...justExpired])]);}return next;});},1000);return()=>window.clearInterval(timer);},[retrying,questions,expired]);

 function resetForRetry(){startedAt.current=Date.now();setAnswers({});setReview(null);setResult(null);setExpired([]);setRemaining(Object.fromEntries(questions.filter(q=>q.time_limit_seconds&&q.time_limit_seconds>0).map(q=>[q.id,Math.ceil(q.time_limit_seconds!)])));setRetrying(true);setError(null);}
 function isExpired(id:string){return expired.includes(id);}
 function formatTime(sec:number){const m=Math.floor(sec/60);const s=sec%60;return `${m}:${String(s).padStart(2,"0")}`;}

 async function submit(){
  if(submitting)return;
  setSubmitting(true);setError(null);
  let score=0;const total=questions.reduce((s,q)=>s+(q.points??1),0);const outcomes:Review={};
  for(const q of questions){const answer=answers[q.id];const pts=q.points??1;let ok=false;
   if(q.type==="complete")ok=String(answer??"").trim().toLocaleLowerCase()===String(q.correctAnswer??q.options[0]??"").trim().toLocaleLowerCase();
   else if(q.type==="numerical")ok=Number(answer)===Number(q.correctAnswer??q.options[0]);
   else if(q.type==="multiple_select"){const expected=parseNumbers(q.correctAnswer);const actual=Array.isArray(answer)?answer:[];ok=expected.length===actual.length&&expected.every(x=>actual.includes(x));}
   else if(q.type==="matching"){const expected=parseMap(q.correctAnswer);const actual=answer&&typeof answer==="object"&&!Array.isArray(answer)?answer as Record<string,number>:{};const keys=Object.keys(expected);ok=keys.length===Object.keys(actual).length&&keys.every(k=>Number(actual[k])===Number(expected[k]));}
   else if(q.type==="ordering"){const expected=parseNumbers(q.correctAnswer,q.options.map((_,i)=>i));const actual=Array.isArray(answer)?answer:[];ok=expected.length===actual.length&&expected.every((x,i)=>x===actual[i]);}
   else ok=answer===q.correctIndex;
   outcomes[q.id]=ok;if(ok)score+=pts;
  }
  const{data:{user}}=await supabase.auth.getUser();if(!user){setError("انتهت الجلسة. سجّل الدخول مرة أخرى.");setSubmitting(false);return;}
  const duration=Math.max(1,Math.round((Date.now()-startedAt.current)/1000));
  const{error:insertError}=await supabase.from("quiz_attempts").insert({quiz_id:quizId,user_id:user.id,score,total,answers,duration_seconds:duration});
  if(insertError){setError("تعذر حفظ النتيجة. حاول مرة أخرى.");setSubmitting(false);return;}
  setAttempts(a=>[...a,{score,total}]);setReview(outcomes);setResult({score,total,duration});setRetrying(false);setSubmitting(false);
 }

 if(!retrying)return <div className="border-t border-line pt-4 mt-2 space-y-4">
  <div><p className={kidsMode?"text-base font-bold text-[#7a3fa0] mb-2":"text-sm font-medium text-ink mb-1"}>{title}</p><span className="inline-block text-xs bg-green-light text-green-text px-2.5 py-1 rounded-full">أعلى نتيجة: {best?.score} من {best?.total}</span><p className="text-xs text-ink-faint mt-2">عدد المحاولات: {attempts.length}{maxAttempts!==null?` من ${maxAttempts}`:""}</p></div>
  {result&&review&&<div className="space-y-3"><div className={kidsMode?"rounded-2xl bg-[#fff8ec] border-2 border-[#ffd166] p-4":"rounded-xl bg-paper border border-line p-4"}><p className="font-bold text-ink">نتيجتك: {result.score} / {result.total} ({result.total?Math.round(result.score/result.total*100):0}%)</p><p className="text-xs text-ink-soft mt-1">الوقت: {formatTime(result.duration)}</p></div>{questions.map((q,i)=><div key={q.id} className="rounded-xl border border-line bg-surface p-4"><div className="flex justify-between gap-3"><p className="text-sm text-ink font-medium">{i+1}. {q.question}</p><span className={review[q.id]?"text-xs text-green-text":"text-xs text-red-600"}>{review[q.id]?"✓ صحيحة":"✗ غير صحيحة"}</span></div>{!review[q.id]&&<p className="text-xs text-ink-soft mt-2"><strong>الإجابة الصحيحة:</strong> {correctAnswerText(q)}</p>}{q.explanation&&<div className="mt-3 rounded-lg bg-paper border border-line p-3 text-xs leading-6 text-ink-soft"><strong>💡 الشرح:</strong> {q.explanation}</div>}</div>)}</div>}
  {canRetry?<button onClick={resetForRetry} className="bg-green text-white text-sm font-medium py-2 px-5 rounded-md">إعادة المحاولة</button>:<p className="text-xs text-ink-faint">خلصت المحاولات المتاحة.</p>}
 </div>;

 const allAnswered=questions.every(q=>{if(isExpired(q.id))return true;const a=answers[q.id];if(a===undefined)return false;if(Array.isArray(a))return a.length>0;if(a&&typeof a==="object")return Object.keys(a).length===q.options.length;return String(a).trim()!=="";});
 return <div className="border-t border-line pt-4 mt-2 space-y-4"><p className={kidsMode?"text-base font-bold text-[#7a3fa0]":"text-sm font-medium text-ink"}>{kidsMode?"🎯 ":""}{title}</p>{questions.map((q,qi)=>{const current=answers[q.id];const locked=isExpired(q.id);return <div key={q.id} className={kidsMode?"bg-[#fff8ec] border-2 border-[#ffd166] rounded-2xl p-4":"bg-paper rounded-lg p-4"}><div className="flex justify-between gap-3 mb-3"><p className="text-sm text-ink">{qi+1}. {q.question}</p><div className="flex items-center gap-2">{q.time_limit_seconds&&q.time_limit_seconds>0&&<span className={`text-[11px] font-semibold whitespace-nowrap ${locked||((remaining[q.id]??0)<=10)?"text-red-600":"text-ink-faint"}`}>{locked?"انتهى الوقت ⏱️":`⏱️ ${formatTime(remaining[q.id]??0)}`}</span>}<span className="text-[11px] text-ink-faint whitespace-nowrap">{q.points??1} نقطة</span></div></div>{q.reading_passage&&<div className="mb-4 rounded-xl bg-surface border border-line p-4 text-sm leading-7 text-ink whitespace-pre-wrap">{q.reading_passage}</div>}{q.media_url&&q.media_type==="image"&&<img src={q.media_url} alt="مرفق السؤال" className="max-h-64 w-full object-contain rounded-xl mb-4"/>}{q.media_url&&q.media_type==="audio"&&<audio controls src={q.media_url} className="w-full mb-4"/>}
 {q.type==="complete"?<input disabled={locked} value={String(current??"")} onChange={e=>setAnswers(a=>({...a,[q.id]:e.target.value}))} placeholder={locked?"انتهى وقت السؤال":"اكتب الإجابة هنا"} className="w-full px-3 py-2 border border-line rounded-md bg-surface text-sm disabled:opacity-60"/>:q.type==="numerical"?<input disabled={locked} type="number" value={String(current??"")} onChange={e=>setAnswers(a=>({...a,[q.id]:e.target.value}))} placeholder={locked?"انتهى وقت السؤال":"اكتب الرقم"} className="w-full px-3 py-2 border border-line rounded-md bg-surface text-sm disabled:opacity-60"/>:q.type==="matching"?<div className="space-y-2">{q.options.map((pair,oi)=>{const [left,...rest]=pair.split("=");const right=rest.join("=").trim();const map=current&&typeof current==="object"&&!Array.isArray(current)?current as Record<string,number>:{};return <label key={oi} className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center text-sm"><span className="text-ink">{left.trim()}</span><select disabled={locked} value={map[String(oi)]??""} onChange={e=>setAnswers(a=>({...a,[q.id]:{...map,[oi]:Number(e.target.value)}}))} className="px-3 py-2 border border-line rounded-md bg-surface disabled:opacity-60"><option value="">اختر المطابقة</option>{q.options.map((p,j)=>{const[, ...r]=p.split("=");return <option key={j} value={j}>{r.join("=").trim()}</option>})}</select></label>})}</div>:q.type==="ordering"?<div className="space-y-2">{q.options.map((opt,oi)=>{const order=Array.isArray(current)?current:[];return <div key={oi} className="flex items-center gap-2"><span className="w-7 h-7 rounded-full bg-surface border border-line flex items-center justify-center text-xs">{order.indexOf(oi)>=0?order.indexOf(oi)+1:"–"}</span><span className="flex-1 text-sm text-ink">{opt}</span><button disabled={locked} type="button" onClick={()=>setAnswers(a=>{const cur=Array.isArray(a[q.id])?[...(a[q.id] as number[])]:[];const next=cur.includes(oi)?cur.filter(x=>x!==oi):[...cur,oi];return {...a,[q.id]:next};})} className="text-xs border border-line rounded-md px-2 py-1 disabled:opacity-50">{order.includes(oi)?"إلغاء":"اختيار"}</button></div>})}<p className="text-xs text-ink-faint">اختر العناصر بالترتيب الصحيح.</p></div>:<div className="space-y-1.5">{q.options.map((opt,oi)=>{const selected:number[]=Array.isArray(current)?current:[];const checked=q.type==="multiple_select"?selected.includes(oi):current===oi;return <label key={oi} className="flex items-center gap-2 text-sm text-ink-soft"><input disabled={locked} type={q.type==="multiple_select"?"checkbox":"radio"} name={q.id} checked={checked} onChange={e=>{if(q.type==="multiple_select"){const cur=Array.isArray(answers[q.id])?[...(answers[q.id] as number[])]:[];setAnswers(a=>({...a,[q.id]:e.target.checked?[...cur,oi]:cur.filter(x=>x!==oi)}));}else setAnswers(a=>({...a,[q.id]:oi}));}}/>{opt}</label>})}</div>}</div>})}{error&&<p className="text-sm text-red-600">{error}</p>}<button onClick={submit} disabled={!allAnswered||submitting} className="bg-green text-white text-sm font-medium py-2 px-5 rounded-md disabled:opacity-50">{submitting?"جاري التصحيح…":"تسليم الإجابات"}</button></div>;
}
