-- Run this once in Supabase SQL Editor, after supabase-setup.sql

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  video_url text,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create table public.quizzes (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  title text not null,
  created_at timestamptz not null default now()
);

create table public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  question text not null,
  options jsonb not null, -- e.g. ["اختيار 1", "اختيار 2", "اختيار 3"]
  correct_index int not null,
  position int not null default 0
);

create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  score int not null,
  total int not null,
  created_at timestamptz not null default now()
);

alter table public.courses enable row level security;
alter table public.lessons enable row level security;
alter table public.quizzes enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_attempts enable row level security;

-- Everyone logged in can read course content
create policy "logged in users can read courses" on public.courses for select using (auth.uid() is not null);
create policy "logged in users can read lessons" on public.lessons for select using (auth.uid() is not null);
create policy "logged in users can read quizzes" on public.quizzes for select using (auth.uid() is not null);
create policy "logged in users can read questions" on public.quiz_questions for select using (auth.uid() is not null);

-- Only admins can create/edit course content
create policy "admins manage courses" on public.courses for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "admins manage lessons" on public.lessons for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "admins manage quizzes" on public.quizzes for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "admins manage questions" on public.quiz_questions for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Users can record and see their own quiz attempts
create policy "users insert own attempts" on public.quiz_attempts for insert
  with check (auth.uid() = user_id);
create policy "users read own attempts" on public.quiz_attempts for select
  using (auth.uid() = user_id);
