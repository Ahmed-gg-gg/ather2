-- Run this once in Supabase SQL Editor.

create policy "admins and teachers view all attempts" on public.quiz_attempts
  for select
  using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'teacher')));
