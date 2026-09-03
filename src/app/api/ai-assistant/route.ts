import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req:Request){
 const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user)return NextResponse.json({error:'غير مصرح'},{status:401});
 const {data:profile}=await supabase.from('profiles').select('full_name,role,grade').eq('id',user.id).single();
 const body=await req.json().catch(()=>({})); const message=String(body.message??'').trim(); const requestedMode=String(body.mode??'student'); const mode=requestedMode==='teacher'?'teacher':'student';
 if(!message)return NextResponse.json({error:'اكتب سؤالك أولًا'},{status:400});
 const isTeacher=['admin','teacher'].includes(profile?.role??''); if(mode==='teacher'&&!isTeacher)return NextResponse.json({error:'وضع المعلم متاح للمعلمين والإدارة فقط.'},{status:403});
 const analytics=mode==='teacher'&&isTeacher?body.analytics??null:null;
 const analyticsText=analytics?`\nبيانات التحليلات الحالية (استخدمها كما هي ولا تخترع أرقامًا): ${JSON.stringify(analytics).slice(0,18000)}`:'';
 const system=`أنت مساعد أثر التعليمي. دورك دعم التعلم لا إعطاء إجابة واجب جاهزة. اشرح خطوة بخطوة، اسأل سؤالًا توجيهيًا عند الحاجة، واستخدم العربية الواضحة. المستخدم: ${profile?.full_name??'طالب'}، الدور: ${profile?.role??mode}، الصف: ${profile?.grade??'غير محدد'}. ${mode==='teacher'?'أنت في وضع المعلم: يمكنك إنشاء أسئلة وأنشطة، شرح الدروس، وتحليل نتائج الطلاب. عند تحليل البيانات، اذكر الأدلة الرقمية الموجودة فقط ثم اقترح تدخلات تعليمية عملية.':''}${analyticsText}`;
 const key=process.env.OPENAI_API_KEY;
 if(!key){return NextResponse.json({reply:mode==='teacher'&&analytics?`تحليل أولي لبيانات أثر:\n\n• المحاولات: ${analytics.metrics?.attempts??0}\n• متوسط الدرجات: ${analytics.metrics?.average_percent??0}%\n• نسبة النجاح: ${analytics.metrics?.pass_rate??0}%\n• الطلاب الذين يحتاجون دعمًا: ${analytics.support_students?.length??0}\n\n🎯 ابدأ بخطة علاجية قصيرة: راجع أكثر سؤال أخطأ فيه الطلاب، ثم كوّن مجموعة دعم للطلاب الأقل من 60%، وبعدها نفّذ اختبارًا قصيرًا للتحقق من التحسن.`:`مساعد أثر يعمل الآن بوضع المساعدة التعليمية الأساسية.\n\nلنبدأ معًا: ${message}\n\n💡 حاول أن تكتب ما الذي فهمته حتى الآن، وسأعطيك تلميحًا واحدًا ثم نكمل خطوة بخطوة.`,configured:false});}
 try{const r=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${key}`},body:JSON.stringify({model:process.env.OPENAI_MODEL||'gpt-5-mini',instructions:system,input:message})});const data=await r.json();if(!r.ok)throw new Error(data?.error?.message||'AI request failed');const reply=data.output_text||data.output?.flatMap((x:any)=>x.content??[]).map((x:any)=>x.text??'').join('')||'لم أتمكن من صياغة رد الآن.';return NextResponse.json({reply,configured:true});}catch{return NextResponse.json({error:'تعذر الاتصال بالمساعد الذكي الآن.'},{status:502});}
}
