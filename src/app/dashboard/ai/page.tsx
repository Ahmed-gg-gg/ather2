import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AIChat from './ai-chat';

type Role = 'student' | 'teacher' | 'admin';

export default async function AIPage() {
 const supabase = await createClient();
 const { data: { user } } = await supabase.auth.getUser();
 if (!user) redirect('/login');
 const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
 const role = profile?.role as string;
 if (!['student', 'teacher', 'admin'].includes(role)) redirect('/dashboard');
 return <AIChat role={role as Role} />;
}
