-- Teacher/student relationship and teacher-owned course access.
-- Apply after the existing account_groups and courses tables exist.

create table if not exists public.teacher_students (
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (teacher_id, student_id),
  check (teacher_id <> student_id)
);

alter table public.teacher_students enable row level security;
create index if not exists teacher_students_student_id_idx on public.teacher_students(student_id);

-- Admins manage all links; teachers manage their own links; students can read their own links.
create policy "admins manage teacher students" on public.teacher_students for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
create policy "teachers manage own student links" on public.teacher_students for all
  using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());
create policy "students read own teacher links" on public.teacher_students for select
  using (student_id = auth.uid());

alter table public.account_groups add column if not exists teacher_id uuid references public.profiles(id) on delete set null;
create index if not exists account_groups_teacher_id_idx on public.account_groups(teacher_id);

-- Student course access is based on teacher_students; admin/teacher accounts retain full read access.
drop policy if exists "logged in users can read courses" on public.courses;
create policy "users read permitted courses" on public.courses for select using (
  auth.uid() is not null and (
    created_by is null
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','teacher'))
    or exists (select 1 from public.teacher_students ts where ts.teacher_id = courses.created_by and ts.student_id = auth.uid())
  )
);
