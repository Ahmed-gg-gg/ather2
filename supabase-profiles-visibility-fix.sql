-- Run this once in Supabase SQL Editor.
-- Fixes the infinite recursion caused by the previous profiles-visibility policy.

-- 1) Remove the broken policy (safe to run even if it doesn't exist)
drop policy if exists "admins and teachers view all profiles" on public.profiles;

-- 2) A helper function that checks the role WITHOUT triggering RLS again
--    (security definer = runs with elevated rights, bypassing RLS on this one lookup)
create or replace function public.is_admin_or_teacher()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'teacher')
  );
$$;

-- 3) Recreate the policy using the safe function
create policy "admins and teachers view all profiles" on public.profiles
  for select
  using (public.is_admin_or_teacher());
