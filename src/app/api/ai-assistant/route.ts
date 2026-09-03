import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req:Request){
 const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user)return NextResponse.json({error:'غير مصرح'},{status:401});
 const {data:profile}=await supabase.from('profiles').select('full_name,role,grade').eq('id',user.id).single();
 const body=await req.json().catch(()=>({})); const message=String(body.message??'').trim(); const mode=String(body.mode??'student'); if(!message)return NextResponse.json({error:'اكتب سؤالك أولًا'},{status:400});
 const system=`أنت مساعد أثر التعليمي. دورك دعم التعلم لا إعطاء إجابة واجب جاهزة. اشرح خطوة بخطوة، اسأل سؤالًا توجيهيًا عند الحاجة، واستخدم العربية الواضحة. المستخدم: ${profile?.full_name??'طالب'}، الدور: ${profile?.role??mode}، الصف: ${profile?.grade??'غير محدد'}. ${mode==='teacher'?'للمعلم: اقترح أسئلة وأنشطة وتحليل أخطاء بشكل عملي.':''}`;
 const key=process.env.OPENAI_API_KEY;
 if(!key){return NextResponse.json({reply:`مساعد أثر يعمل الآن بوضع المساعدة التعليمية الأساسية.\n\nلنبدأ معًا: ${message}\n\n💡 حاول أن تكتب ما الذي فهمته حتى الآن، وسأعطيك تلميحًا واحدًا ثم نكمل خطوة بخطوة.`,configured:false});}
 try{const r=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${key}`},body:JSON.stringify({model:process.env.OPENAI_MODEL||'gpt-5-mini',instructions:system,input:message})});const data=await r.json();if(!r.ok)throw new Error(data?.error?.message||'AI request failed');const reply=data.output_text||data.output?.flatMap((x:any)=>x.content??[]).map((x:any)=>x.text??'').join('')||'لم أتمكن من صياغة رد الآن.';return NextResponse.json({reply,configured:true});}catch(e){return NextResponse.json({error:'تعذر الاتصال بالمساعد الذكي الآن.'},{status:502});}
}
