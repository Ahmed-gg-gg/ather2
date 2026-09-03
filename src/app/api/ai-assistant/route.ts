import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type ChatMessage={role:'user'|'assistant';text:string};

export async function POST(req:Request){
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)return NextResponse.json({error:'غير مصرح'},{status:401});
 const {data:profile}=await supabase.from('profiles').select('full_name,role,grade').eq('id',user.id).single();
 const body=await req.json().catch(()=>({}));
 const message=String(body.message??'').trim();
 const requestedMode=String(body.mode??'student');
 const mode=requestedMode==='teacher'?'teacher':'student';
 const history:Array<ChatMessage>=Array.isArray(body.history)?body.history.filter((m:any)=>m&&['user','assistant'].includes(m.role)&&typeof m.text==='string').slice(-12):[];
 if(!message)return NextResponse.json({error:'اكتب سؤالك أولًا'},{status:400});
 const isTeacher=['admin','teacher'].includes(profile?.role??'');
 if(mode==='teacher'&&!isTeacher)return NextResponse.json({error:'وضع المعلم متاح للمعلمين والإدارة فقط.'},{status:403});
 const analytics=mode==='teacher'&&isTeacher?body.analytics??null:null;
 const analyticsText=analytics?`\nبيانات التحليلات الحالية (استخدمها كما هي ولا تخترع أرقامًا): ${JSON.stringify(analytics).slice(0,18000)}`:'';
 const system=`أنت «مساعد أثر الذكي»، مساعد تعليمي عربي عملي ومشجع. افهم سؤال المستخدم أولًا ثم أعطه إجابة مفيدة ومباشرة، مع أمثلة عند الحاجة. لا تكرر عبارات عامة مثل «اكتب ما فهمته» إذا كان السؤال واضحًا. في وضع الطالب: ساعده على التفكير والفهم، ولا تعطِ إجابة واجب جاهزة دون شرح؛ يمكنك كشف النتيجة النهائية بعد بناء خطوات الحل إذا طلبها بوضوح. في وضع المعلم: يمكنك إنشاء أسئلة متنوعة، أنشطة، خطط علاجية، شرح دروس، وتحليل أخطاء الطلاب. استخدم مستوى الصف ${profile?.grade??'غير محدد'} عندما يكون مناسبًا. المستخدم: ${profile?.full_name??'مستخدم أثر'}، الدور: ${profile?.role??mode}.${analyticsText}`;
 const key=process.env.OPENROUTER_API_KEY;
 if(!key){
  return NextResponse.json({configured:false,reply:mode==='teacher'&&analytics?`⚠️ المساعد الذكي الكامل غير مُفعّل على نسخة الإنتاج حاليًا.\n\nتحليل احتياطي لبياناتك:\n• المحاولات: ${analytics.metrics?.attempts??0}\n• متوسط الدرجات: ${analytics.metrics?.average_percent??0}%\n• نسبة النجاح: ${analytics.metrics?.pass_rate??0}%\n• الطلاب الذين يحتاجون دعمًا: ${analytics.support_students?.length??0}\n\n🎯 اقتراح عملي: ابدأ بالسؤال الأعلى في نسبة الخطأ، ثم نفّذ نشاطًا علاجيًا قصيرًا، وبعده اختبار تحقق من 3–5 أسئلة.`:`⚠️ المساعد الذكي الكامل غير مُفعّل على نسخة الإنتاج حاليًا.\n\nالواجهة تعمل، لكن لا يوجد مفتاح OpenRouter متاح للخادم. أضف OPENROUTER_API_KEY من إعدادات البيئة لتفعيل DeepSeek المجاني.`,});
 }
 try{
  const messages=[{role:'system' as const,content:system},...history.filter((m)=>m.text!==message).map((m)=>({role:m.role as 'user'|'assistant',content:m.text})),{role:'user' as const,content:message}];
  const r=await fetch('https://openrouter.ai/api/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${key}`,'HTTP-Referer':process.env.NEXT_PUBLIC_SITE_URL||'https://ather-ar.vercel.app','X-Title':'أثر - مساعد تعليمي'},body:JSON.stringify({model:process.env.OPENROUTER_MODEL||'deepseek/deepseek-v4-flash:free',messages,temperature:0.4,max_tokens:1200})});
  const data=await r.json();
  if(!r.ok)throw new Error(data?.error?.message||'OpenRouter AI request failed');
  const reply=data?.choices?.[0]?.message?.content||'لم أتمكن من صياغة رد الآن.';
  return NextResponse.json({reply,configured:true,provider:'openrouter',model:process.env.OPENROUTER_MODEL||'deepseek/deepseek-v4-flash:free'});
 }catch(error){
  console.error('AI assistant error',error);
  return NextResponse.json({error:'تعذر الاتصال بمساعد DeepSeek المجاني الآن. قد يكون حد الاستخدام المجاني قد انتهى مؤقتًا؛ حاول مرة أخرى لاحقًا.',configured:true},{status:502});
 }
}
