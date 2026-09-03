"use client";
import { useState } from 'react';
import BackButton from '@/components/back-button';

type Msg={role:'user'|'assistant';text:string};

const studentPrompts=['اشرح لي الدرس بطريقة بسيطة','ساعدني في حل هذه المسألة خطوة بخطوة','اختبرني في هذا الدرس بسؤال واحد'];
const teacherPrompts=['أنشئ 5 أسئلة اختيار من متعدد عن الكسور','اشرح هذا الدرس للطلاب بطريقة مبسطة','حلل أخطاء الطلاب واقترح خطة علاجية'];

export default function AIPage(){
 const[messages,setMessages]=useState<Msg[]>([{role:'assistant',text:'مرحبًا 👋 أنا مساعد أثر. اكتب السؤال أو أرسل نص المسألة، وسأفهم السياق معك وأشرح خطوة بخطوة. في وضع الطالب لن أعطي إجابة الواجب جاهزة.'}]);
 const[input,setInput]=useState('');
 const[mode,setMode]=useState<'student'|'teacher'>('student');
 const[loading,setLoading]=useState(false);
 const[configured,setConfigured]=useState<boolean|null>(null);

 async function send(prefill?:string){
  const text=(prefill??input).trim(); if(!text||loading)return;
  setInput('');
  const next=[...messages,{role:'user' as const,text}];
  setMessages(next); setLoading(true);
  try{
   const r=await fetch('/api/ai-assistant',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:text,mode,history:next.slice(-12)})});
   const d=await r.json();
   setConfigured(typeof d.configured==='boolean'?d.configured:null);
   setMessages(m=>[...m,{role:'assistant',text:d.reply||d.error||'حدث خطأ غير متوقع.'}]);
  }catch{
   setMessages(m=>[...m,{role:'assistant',text:'تعذر الاتصال بالمساعد الآن. تحقق من اتصال الإنترنت ثم حاول مرة أخرى.'}]);
  }finally{setLoading(false)}
 }

 const prompts=mode==='teacher'?teacherPrompts:studentPrompts;
 return <div className="min-h-screen bg-paper"><div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10"><div className="mb-4"><BackButton/></div><div className="flex flex-wrap justify-between items-end gap-3 mb-5"><div><h1 className="font-display text-2xl font-medium text-ink">مساعد أثر الذكي 🤖</h1><p className="text-sm text-ink-soft mt-1">شرح، تلميحات، إنشاء أسئلة، وتحليل أخطاء — مع حفظ سياق المحادثة.</p></div><select value={mode} onChange={e=>setMode(e.target.value as 'student'|'teacher')} className="border border-line rounded-md px-3 py-2 bg-surface text-sm"><option value="student">وضع الطالب</option><option value="teacher">وضع المعلم</option></select></div>
 {configured===false&&<div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">⚠️ المساعد الذكي غير مُفعّل حاليًا على نسخة الإنتاج؛ الردود الظاهرة الآن وضع مساعدة احتياطي وليست نموذج الذكاء الاصطناعي الكامل.</div>}
 <div className="bg-surface border border-line rounded-2xl p-4 min-h-[480px] flex flex-col"><div className="flex flex-wrap gap-2 mb-4">{prompts.map(p=><button key={p} onClick={()=>void send(p)} disabled={loading} className="border border-line rounded-full px-3 py-2 text-xs bg-paper hover:bg-surface disabled:opacity-50">{p}</button>)}</div><div className="flex-1 space-y-3 overflow-auto">{messages.map((m,i)=><div key={i} className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${m.role==='user'?'mr-auto bg-green text-white':'ml-auto bg-paper border border-line text-ink'}`}>{m.text}</div>)}{loading&&<div className="ml-auto bg-paper border border-line rounded-2xl px-4 py-3 text-sm text-ink-faint">أفكر في أفضل شرح…</div>}</div><div className="flex gap-2 mt-4"><input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')void send()}} placeholder={mode==='teacher'?'مثال: أنشئ اختبارًا عن الكسور للصف الرابع…':'اكتب سؤالك أو الصق المسألة التي تحتاج شرحها…'} className="flex-1 border border-line rounded-xl px-4 py-3 bg-paper text-sm"/><button onClick={()=>void send()} disabled={loading||!input.trim()} className="bg-green text-white rounded-xl px-5 py-3 text-sm disabled:opacity-50">إرسال</button></div></div></div></div>
}
