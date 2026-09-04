"use client";
import { useState } from 'react';
import BackButton from '@/components/back-button';

type Role = 'student' | 'teacher' | 'admin';
type Msg = { role: 'user' | 'assistant'; text: string };

const config: Record<Role, { title: string; subtitle: string; welcome: string; prompts: { label: string; prompt: string }[] }> = {
 student: {
  title: 'مساعد أثر للطالب 🤖',
  subtitle: 'شرح وتلميحات ومساعدة على الفهم — بدون إعطاء إجابة الواجب جاهزة.',
  welcome: 'مرحبًا 👋 أنا مساعد أثر للطالب. ابعتلي السؤال أو المسألة، وهساعدك تفهمها وتحلها خطوة بخطوة بدون ما أديك إجابة الواجب جاهزة.',
  prompts: [
   { label: '📚 اشرح لي الدرس', prompt: 'اشرح لي الدرس بطريقة بسيطة ومناسبة لمستواي الدراسي.' },
   { label: '🧩 ساعدني في المسألة', prompt: 'ساعدني في حل هذه المسألة خطوة بخطوة، وخليني أفكر معك بدل ما تعطيني الإجابة مباشرة.' },
   { label: '🎯 اختبرني', prompt: 'اختبرني بسؤال واحد مناسب لمستواي، وبعد إجابتي قيّمها واشرح لي الخطأ إن وجد.' },
  ]
 },
 teacher: {
  title: 'مساعد أثر للمعلم 👨‍🏫🤖',
  subtitle: 'تخطيط الدروس، إنشاء الأسئلة والاختبارات، الأنشطة وتحليل أخطاء الطلاب.',
  welcome: 'مرحبًا 👋 أنا مساعد أثر للمعلم. أقدر أساعدك في إعداد الدروس والأنشطة والأسئلة والاختبارات وتحليل أخطاء الطلاب.',
  prompts: [
   { label: '📝 توليد اختبار', prompt: 'أنشئ اختبارًا متكاملًا من 10 أسئلة عن الكسور للصف الرابع، ونوّع بين الاختيار من متعدد والصواب والخطأ والمسائل العددية، مع الإجابة الصحيحة ودرجة كل سؤال.' },
   { label: '❓ إنشاء أسئلة', prompt: 'أنشئ 5 أسئلة متنوعة عن درس الكسور للصف الرابع، مع الإجابات الصحيحة وشرح مختصر لكل إجابة.' },
   { label: '📚 خطة درس', prompt: 'صمّم خطة درس كاملة للصف الرابع عن الكسور تشمل الهدف والتمهيد والشرح والنشاط والتقويم والواجب.' },
   { label: '🎨 نشاط تعليمي', prompt: 'صمّم نشاطًا تعليميًا ممتعًا عن الكسور للصف الرابع، مع الهدف والخطوات والأدوات وطريقة التقييم.' },
   { label: '📊 تحليل أخطاء', prompt: 'حلل أخطاء الطلاب في اختبار عن الكسور، وحدد المهارات التي تحتاج دعمًا واقترح خطة علاجية عملية لمدة أسبوع.' },
  ]
 },
 admin: {
  title: 'مساعد أثر للإدارة 👑🤖',
  subtitle: 'مساعد إداري شامل لإدارة الحسابات والكورسات والمجموعات والنتائج والنشاط وتشخيص مشاكل المنصة.',
  welcome: 'مرحبًا 👋 أنا مساعد أثر للإدارة. أقدر أساعدك في إدارة وتشخيص المنصة: المستخدمين والصلاحيات والمجموعات والكورسات والنتائج والنشاط، وأرتب لك خطوات التنفيذ وأقترح حلولًا للمشاكل.',
  prompts: [
   { label: '👥 إدارة المستخدمين', prompt: 'ساعدني في مراجعة وتنظيم حسابات الطلاب والمعلمين وولي الأمر والصلاحيات، واقترح إجراءات الإدارة المناسبة.' },
   { label: '📚 إدارة الكورسات', prompt: 'ساعدني في تنظيم هيكل المواد والكورسات والدروس والكويزات، واقترح أفضل طريقة لإدارة المحتوى.' },
   { label: '🏫 المجموعات والطلاب', prompt: 'ساعدني في تنظيم الطلاب حسب الصف والمجموعة، وإنشاء خطة مناسبة للحسابات الجماعية وربط الطلاب بالمعلمين.' },
   { label: '📊 تحليل النتائج', prompt: 'ساعدني في تحليل نتائج الطلاب وتحديد الطلاب والمهارات التي تحتاج تدخلًا، واقترح إجراءات عملية.' },
   { label: '🛠️ تشخيص مشكلة', prompt: 'ساعدني في تشخيص أي مشكلة في منصة أثر. سأصف لك المشكلة، حلل السبب المحتمل ثم أعطني خطوات فحص وإصلاح مرتبة.' },
   { label: '🔐 مراجعة الصلاحيات', prompt: 'راجع معي تصميم صلاحيات admin وteacher وstudent وparent واقترح أي ثغرات أو تحسينات لازمة.' },
  ]
 }
};

export default function AIChat({ role }: { role: Role }) {
 const [messages, setMessages] = useState<Msg[]>([{ role: 'assistant', text: config[role].welcome }]);
 const [input, setInput] = useState('');
 const [loading, setLoading] = useState(false);
 const [configured, setConfigured] = useState<boolean | null>(null);
 const meta = config[role];

 async function send(prefill?: string) {
  const text = (prefill ?? input).trim(); if (!text || loading) return;
  setInput('');
  const next = [...messages, { role: 'user' as const, text }];
  setMessages(next); setLoading(true);
  try {
   const r = await fetch('/api/ai-assistant', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: text, history: next.slice(-12) }) });
   const d = await r.json();
   setConfigured(typeof d.configured === 'boolean' ? d.configured : null);
   setMessages(m => [...m, { role: 'assistant', text: d.reply || d.error || 'حدث خطأ غير متوقع.' }]);
  } catch {
   setMessages(m => [...m, { role: 'assistant', text: 'تعذر الاتصال بالمساعد الآن. تحقق من اتصال الإنترنت ثم حاول مرة أخرى.' }]);
  } finally { setLoading(false); }
 }

 return <div className="min-h-screen bg-paper"><div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10"><div className="mb-4"><BackButton /></div><div className="mb-5"><h1 className="font-display text-2xl font-medium text-ink">{meta.title}</h1><p className="text-sm text-ink-soft mt-1">{meta.subtitle}</p></div>
 {configured === false && <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">⚠️ المساعد الذكي الكامل غير مُفعّل حاليًا على نسخة الإنتاج.</div>}
 <div className="bg-surface border border-line rounded-2xl p-4 min-h-[520px] flex flex-col"><div className="mb-4"><div className="text-xs font-semibold text-ink-soft mb-2">اقتراحات سريعة</div><div className="flex flex-wrap gap-2">{meta.prompts.map(p => <button key={p.label} onClick={() => void send(p.prompt)} disabled={loading} className="border border-line rounded-full px-3 py-2 text-xs bg-paper hover:bg-surface disabled:opacity-50">{p.label}</button>)}</div></div><div className="flex-1 space-y-3 overflow-auto">{messages.map((m, i) => <div key={i} className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${m.role === 'user' ? 'mr-auto bg-green text-white' : 'ml-auto bg-paper border border-line text-ink'}`}>{m.text}</div>)}{loading && <div className="ml-auto bg-paper border border-line rounded-2xl px-4 py-3 text-sm text-ink-faint">أفكر في أفضل مساعدة…</div>}</div><div className="flex gap-2 mt-4"><input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') void send(); }} placeholder={role === 'admin' ? 'اكتب مشكلة أو مهمة إدارية…' : role === 'teacher' ? 'اكتب مهمة أو سؤالًا تعليميًا…' : 'اكتب سؤالك أو المسألة التي تحتاج شرحها…'} className="flex-1 border border-line rounded-xl px-4 py-3 bg-paper text-sm"/><button onClick={() => void send()} disabled={loading || !input.trim()} className="bg-green text-white rounded-xl px-5 py-3 text-sm disabled:opacity-50">إرسال</button></div></div></div></div>;
}
