-- أثر platform upgrade: run once in Supabase SQL Editor.
alter table public.profiles add column if not exists grade text;
alter table public.courses add column if not exists grade text;
alter table public.quiz_questions add column if not exists correct_answer text;
create table if not exists public.account_groups (id uuid primary key default gen_random_uuid(), name text not null, grade text, created_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default now());
create table if not exists public.account_group_members (group_id uuid not null references public.account_groups(id) on delete cascade, user_id uuid not null references public.profiles(id) on delete cascade, joined_at timestamptz not null default now(), primary key (group_id,user_id));
create index if not exists account_group_members_user_id_idx on public.account_group_members(user_id);
create index if not exists account_groups_grade_idx on public.account_groups(grade);
alter table public.account_groups enable row level security;
alter table public.account_group_members enable row level security;
drop policy if exists "staff can read groups" on public.account_groups;
drop policy if exists "staff can manage groups" on public.account_groups;
drop policy if exists "staff can read memberships" on public.account_group_members;
drop policy if exists "staff can manage memberships" on public.account_group_members;
create policy "staff can read groups" on public.account_groups for select using (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in ('admin','teacher')));
create policy "staff can manage groups" on public.account_groups for all using (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in ('admin','teacher'))) with check (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in ('admin','teacher')));
create policy "staff can read memberships" on public.account_group_members for select using (user_id=auth.uid() or exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in ('admin','teacher')));
create policy "staff can manage memberships" on public.account_group_members for all using (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in ('admin','teacher'))) with check (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in ('admin','teacher')));
create or replace function public.handle_new_user() returns trigger as $$ begin insert into public.profiles(id,full_name,role,grade) values(new.id,coalesce(new.raw_user_meta_data->>'full_name','New user'),coalesce((new.raw_user_meta_data->>'role')::user_role,'student'),new.raw_user_meta_data->>'grade'); return new; end; $$ language plpgsql security definer set search_path=public;
