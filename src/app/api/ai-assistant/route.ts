import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

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
 const cookieStore = await cookies();
 const powerCode = process.env.AI_POWER_CODE;
 const isPowerMode = !!powerCode && cookieStore.get('ather_power_ai')?.value === powerCode;

 // The phrase only starts the password flow; it never activates power mode by itself.
 if (String(body.action ?? '') === 'activate_power') {
  const suppliedPassword = String(body.password ?? '');
  if (!powerCode) return NextResponse.json({ reply: '⚠️ رمز التفعيل غير مضبوط في إعدادات الخادم.', configured: false, powerMode: false });
  if (suppliedPassword !== powerCode) return NextResponse.json({ reply: '❌ كلمة المرور غير صحيحة. وضع القوة القصوى لم يتم تفعيله؛ حاول مرة أخرى.', configured: true, passwordRequired: true, powerMode: false });
  cookieStore.set('ather_power_ai', powerCode, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 60 * 60 * 8 });
  return NextResponse.json({ reply: '🚀 تم تفعيل وضع القوة القصوى للذكاء الاصطناعي لمدة 8 ساعات. رسائلك التالية ستستخدم Agent Router.', configured: true, activated: true, powerMode: true });
 }
 if (!message) return NextResponse.json({ error: 'اكتب سؤالك أولًا' }, { status: 400 });
 if (/^ai\s*power$/i.test(message)) {
  return NextResponse.json({ reply: '🔐 أدخل كلمة المرور لتفعيل وضع القوة القصوى. لن يتم تفعيل الوضع أو استخدام رصيد Agent Router قبل التحقق منها.', configured: true, passwordRequired: true, powerMode: isPowerMode });
 }
 if (message === 'إيقاف القوة القصوى') {
  cookieStore.delete('ather_power_ai');
  return NextResponse.json({ reply: 'تم إيقاف وضع القوة القصوى. رجعنا للمساعد العادي.', configured: true, powerMode: false, deactivated: true });
 }

 const roleInstructions: Record<Role, string> = {
  student: 'أنت مساعد الطالب فقط. ساعد الطالب على الفهم والتفكير وحل المسائل خطوة بخطوة. لا تتصرف كمعلم أو مدير ولا تنفذ مهام إدارية. لا تعطِ إجابة الواجب جاهزة دون شرح.',
  teacher: 'أنت مساعد المعلم فقط. ساعد المعلم في شرح الدروس، إعداد الخطط والأنشطة والأسئلة والاختبارات وتحليل أخطاء الطلاب واقتراح العلاج. لا تتصرف كطالب أو مدير.',
  admin: 'أنت مساعد الإدارة الشامل لمنصة أثر. ساعد الأدمن في كل ما يخص إدارة المنصة: المستخدمين والأدوار والصلاحيات والحسابات وكلمات المرور بطريقة آمنة، المجموعات والطلاب والمعلمين، المواد والكورسات والدروس والكويزات، النتائج والتحليلات والنشاط والإشعارات، وتشخيص مشاكل المنصة واقتراح خطوات إصلاح واختبار. عندما يطلب الأدمن إجراءً حساسًا، وضّح له الخطوات الآمنة ولا تطلب كلمات مرور أو أسرار. يمكنك إعداد قوائم وخطط ونصوص وSQL آمن للمراجعة، لكن لا تدّعِ أنك نفذت تغييرًا في قاعدة البيانات ما لم يكن هناك إجراء فعلي متاح لك.',
 };
 const system = `أنت «مساعد أثر الذكي». ${roleInstructions[role as Role]}\nكن عمليًا ودقيقًا ومباشرًا، واستعمل مستوى الصف ${profile?.grade ?? 'غير محدد'} عندما يكون مناسبًا. المستخدم: ${profile?.full_name ?? 'مستخدم أثر'}، الدور: ${role}.`;
 const key = isPowerMode ? process.env.AGENTROUTER_API_KEY : process.env.OPENROUTER_API_KEY;
 const model = isPowerMode ? process.env.AGENTROUTER_MODEL : (process.env.OPENROUTER_MODEL || 'openrouter/free');
 const provider = isPowerMode ? 'agentrouter' : 'openrouter';
 if (!key) return NextResponse.json({ configured: false, powerMode: isPowerMode, reply: isPowerMode ? '⚠️ وضع القوة مفعّل، لكن مفتاح Agent Router غير مضبوط في إعدادات الخادم.' : '⚠️ المساعد الذكي الكامل غير مُفعّل حاليًا على نسخة الإنتاج. الواجهة تعمل، لكن لا يوجد مفتاح OpenRouter متاح للخادم.' });
 if (isPowerMode && !model) return NextResponse.json({ configured: false, powerMode: true, reply: '⚠️ أضف AGENTROUTER_MODEL في إعدادات الخادم باسم موديل متاح لحسابك.' });
 try {
  const messages = [{ role: 'system' as const, content: system }, ...history.filter(m => m.text !== message).map(m => ({ role: m.role as 'user'|'assistant', content: m.text })), { role: 'user' as const, content: message }];
  const apiUrl = isPowerMode ? 'https://co.agentrouter.org/v1/chat/completions' : 'https://openrouter.ai/api/v1/chat/completions';
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${key}`, 'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://ather-ar.vercel.app', 'X-Title': 'Ather Educational Assistant' };
  const requestCompletion = async (selectedModel: string) => {
   const response = await fetch(apiUrl, { method: 'POST', headers, body: JSON.stringify({ model: selectedModel, messages, temperature: 0.4, max_tokens: 1600 }) });
   const raw = await response.text();
   let parsed: any = {};
   try { parsed = raw ? JSON.parse(raw) : {}; } catch { parsed = { _nonJson: raw.slice(0, 180) }; }
   return { response, parsed, raw };
  };
  let selectedModel = model;
  let result = await requestCompletion(selectedModel);

  // Discover live Agent Router models and retry only for model-related errors, never for 401/auth failures.
  if (isPowerMode && !result.response.ok && [400, 404].includes(result.response.status)) {
   const firstError = String(result.parsed?.error?.message || result.parsed?.message || '');
   if (/model|not found|unsupported|不存在|模型/i.test(firstError)) {
    try {
     const catalogResponse = await fetch('https://co.agentrouter.org/v1/models', { headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' }, cache: 'no-store' });
     const catalogRaw = await catalogResponse.text();
     const catalog = catalogRaw ? JSON.parse(catalogRaw) : {};
     const available = Array.isArray(catalog?.data) ? catalog.data.map((item: any) => String(item?.id || '')).filter(Boolean) : [];
     const alternatives = available.filter((id: string) => id !== selectedModel).slice(0, 3);
     for (const candidate of alternatives) {
      const retry = await requestCompletion(candidate);
      result = retry;
      if (retry.response.ok) { selectedModel = candidate; break; }
      if (![400, 404].includes(retry.response.status)) break;
     }
    } catch (discoveryError) {
     console.error('Agent Router model discovery failed', { error: discoveryError instanceof Error ? discoveryError.message : 'unknown' });
    }
   }
  }

  const { response: r, parsed: data, raw: rawResponse } = result;
  if (data?._nonJson) {
   console.error('AI provider returned non-JSON response', { provider, status: r.status, contentType: r.headers.get('content-type'), preview: data._nonJson });
   return NextResponse.json({ error: isPowerMode
    ? `Agent Router رجّع استجابة غير متوقعة (HTTP ${r.status}).`
    : `OpenRouter رجّع استجابة غير متوقعة (HTTP ${r.status}).`, configured: true, powerMode: isPowerMode, providerStatus: r.status }, { status: 502 });
  }
  if (!r.ok) {
   const providerMessage = String(data?.error?.message || data?.error?.detail || data?.message || `HTTP ${r.status}`).slice(0, 240);
   console.error('AI provider HTTP error', { provider, status: r.status, message: providerMessage });
   const userError = isPowerMode && r.status === 401
    ? 'Agent Router رفض مفتاح API (401 Unauthorized). راجع أن AGENTROUTER_API_KEY هو مفتاح API الفعلي من لوحة Agent Router وليس رمزًا آخر، وتأكد من نسخه كاملًا دون مسافات.'
    : isPowerMode ? `فشل Agent Router (HTTP ${r.status}): ${providerMessage}` : `فشل OpenRouter (HTTP ${r.status}): ${providerMessage}`;
   return NextResponse.json({ error: userError, configured: true, powerMode: isPowerMode, providerStatus: r.status }, { status: 502 });
  }
  return NextResponse.json({ reply: data?.choices?.[0]?.message?.content || 'لم أتمكن من صياغة رد الآن.', configured: true, provider, powerMode: isPowerMode, model: data?.model || selectedModel });
 } catch (error) {
  console.error('AI assistant error', error);
  return NextResponse.json({ error: isPowerMode ? 'تعذر الاتصال بـ Agent Router. راجع مفتاح API واسم الموديل والرصيد.' : 'تعذر الاتصال بالمساعد الذكي المجاني الآن. قد يكون حد الاستخدام المجاني في OpenRouter قد انتهى مؤقتًا؛ حاول مرة أخرى لاحقًا.', configured: true, powerMode: isPowerMode }, { status: 502 });
 }
}
