-- Run this once in Supabase SQL Editor, after all previous migration files.
-- Requires supabase-profiles-visibility-fix.sql to already be applied
-- (uses the public.is_admin_or_teacher() helper it creates).

-- ============================================================
-- 1) المواد الدراسية (Subjects) — يديرها الأدمن من الداشبورد
-- ============================================================
create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  language text not null default 'ar' check (language in ('ar', 'en')),
  created_at timestamptz not null default now()
);

alter table public.subjects enable row level security;

create policy "logged in users can read subjects" on public.subjects
  for select using (auth.uid() is not null);

create policy "admins and teachers manage subjects" on public.subjects for all
  using (public.is_admin_or_teacher())
  with check (public.is_admin_or_teacher());

-- ============================================================
-- 2) الكورس: مادة + نوع مدرسة (تجريبي / عربي / خاص) + لغة الدراسة
--    لغة الدراسة بتتحدد بس لو نوع المدرسة "خاص"
-- ============================================================
alter table public.courses add column subject_id uuid references public.subjects(id);
alter table public.courses add column school_type text
  check (school_type in ('تجريبي', 'عربي', 'خاص'));
alter table public.courses add column study_language text
  check (study_language in ('ar', 'en'));

-- ============================================================
-- 3) نوع السؤال: اختيار من متعدد أو صح/غلط
--    (options + correct_index بيشتغلوا زي ما هم، العمود ده بس علشان
--     واجهة الأدمن تعرف تعرض شكل الإدخال المناسب)
-- ============================================================
alter table public.quiz_questions add column question_type text
  not null default 'multiple_choice'
  check (question_type in ('multiple_choice', 'true_false'));

-- ============================================================
-- 4) ربط ولي الأمر بالطلاب (أكتر من طالب لكل ولي أمر)
-- ============================================================
create table public.parent_student (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (parent_id, student_id)
);

alter table public.parent_student enable row level security;

create policy "admins and teachers manage parent_student" on public.parent_student for all
  using (public.is_admin_or_teacher())
  with check (public.is_admin_or_teacher());

create policy "parents read own links" on public.parent_student for select
  using (auth.uid() = parent_id);

-- ولي الأمر يقدر يشوف بروفايل ودرجات أبنائه المرتبطين بيه بس
create policy "parents view linked student profiles" on public.profiles for select
  using (
    exists (
      select 1 from public.parent_student ps
      where ps.parent_id = auth.uid() and ps.student_id = profiles.id
    )
  );

create policy "parents view linked student attempts" on public.quiz_attempts for select
  using (
    exists (
      select 1 from public.parent_student ps
      where ps.parent_id = auth.uid() and ps.student_id = quiz_attempts.user_id
    )
  );
