-- Run this once in Supabase SQL Editor.
-- Gives teachers the same course-management permissions as admins.

drop policy if exists "admins manage courses" on public.courses;
drop policy if exists "admins manage lessons" on public.lessons;
drop policy if exists "admins manage quizzes" on public.quizzes;
drop policy if exists "admins manage questions" on public.quiz_questions;

create policy "admins and teachers manage courses" on public.courses for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'teacher')))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'teacher')));

create policy "admins and teachers manage lessons" on public.lessons for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'teacher')))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'teacher')));

create policy "admins and teachers manage quizzes" on public.quizzes for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'teacher')))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'teacher')));

create policy "admins and teachers manage questions" on public.quiz_questions for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'teacher')))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'teacher')));
