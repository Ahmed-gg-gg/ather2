-- Run this once in Supabase SQL Editor.

create policy "admins and teachers view all profiles" on public.profiles
  for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'teacher')
    )
  );
