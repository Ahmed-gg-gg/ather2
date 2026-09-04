import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type ChatMessage = { role: 'user' | 'assistant'; text: string };
type Role = 'student' | 'teacher' | 'admin';

export async function POST(req: Request) {
 const supabase = await createClient();
 const { data: { user } } = await supabase.auth.getUser();
 if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
 const { data: profile } = await supabase.from('profiles').select('full_name,role,grade').eq('id', user.id).single();
 const role = profile?.role as string;
 if (!['student', 'teacher', 'admin'].includes(role)) return NextResponse.json({ error: 'المساعد الذكي غير متاح لهذا الدور.' }, { status: 403 });
 const body = await req.json().catch(() => ({}));
 const message = String(body.message ?? '').trim();
 const history: ChatMessage[] = Array.isArray(body.history) ? body.history.filter((m: any) => m && ['user','assistant'].includes(m.role) && typeof m.text === 'string').slice(-12) : [];
 if (!message) return NextResponse.json({ error: 'اكتب سؤالك أولًا' }, { status: 400 });

 const roleInstructions: Record<Role, string> = {
  student: 'أنت مساعد الطالب فقط. ساعد الطالب على الفهم والتفكير وحل المسائل خطوة بخطوة. لا تتصرف كمعلم أو مدير ولا تنفذ مهام إدارية. لا تعطِ إجابة الواجب جاهزة دون شرح.',
  teacher: 'أنت مساعد المعلم فقط. ساعد المعلم في شرح الدروس، إعداد الخطط والأنشطة والأسئلة والاختبارات وتحليل أخطاء الطلاب واقتراح العلاج. لا تتصرف كطالب أو مدير.',
  admin: 'أنت مساعد الإدارة الشامل لمنصة أثر. ساعد الأدمن في كل ما يخص إدارة المنصة: المستخدمين والأدوار والصلاحيات والحسابات وكلمات المرور بطريقة آمنة، المجموعات والطلاب والمعلمين، المواد والكورسات والدروس والكويزات، النتائج والتحليلات والنشاط والإشعارات، وتشخيص مشاكل المنصة واقتراح خطوات إصلاح واختبار. عندما يطلب الأدمن إجراءً حساسًا، وضّح له الخطوات الآمنة ولا تطلب كلمات مرور أو أسرار. يمكنك إعداد قوائم وخطط ونصوص وSQL آمن للمراجعة، لكن لا تدّعِ أنك نفذت تغييرًا في قاعدة البيانات ما لم يكن هناك إجراء فعلي متاح لك.',
 };
 const system = `أنت «مساعد أثر الذكي». ${roleInstructions[role as Role]}\nكن عمليًا ودقيقًا ومباشرًا، واستعمل مستوى الصف ${profile?.grade ?? 'غير محدد'} عندما يكون مناسبًا. المستخدم: ${profile?.full_name ?? 'مستخدم أثر'}، الدور: ${role}.`;
 const key = process.env.OPENROUTER_API_KEY;
 const model = process.env.OPENROUTER_MODEL || 'openrouter/free';
 if (!key) return NextResponse.json({ configured: false, reply: '⚠️ المساعد الذكي الكامل غير مُفعّل حاليًا على نسخة الإنتاج. الواجهة تعمل، لكن لا يوجد مفتاح OpenRouter متاح للخادم.' });
 try {
  const messages = [{ role: 'system' as const, content: system }, ...history.filter(m => m.text !== message).map(m => ({ role: m.role as 'user'|'assistant', content: m.text })), { role: 'user' as const, content: message }];
  const r = await fetch('https://openrouter.ai/api/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}`, 'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://ather-ar.vercel.app', 'X-Title': 'Ather Educational Assistant' }, body: JSON.stringify({ model, messages, temperature: 0.4, max_tokens: 1600 }) });
  const data = await r.json();
  if (!r.ok) throw new Error(data?.error?.message || 'OpenRouter AI request failed');
  return NextResponse.json({ reply: data?.choices?.[0]?.message?.content || 'لم أتمكن من صياغة رد الآن.', configured: true, provider: 'openrouter', model: data?.model || model });
 } catch (error) {
  console.error('AI assistant error', error);
  return NextResponse.json({ error: 'تعذر الاتصال بالمساعد الذكي المجاني الآن. قد يكون حد الاستخدام المجاني في OpenRouter قد انتهى مؤقتًا؛ حاول مرة أخرى لاحقًا.', configured: true }, { status: 502 });
 }
}
