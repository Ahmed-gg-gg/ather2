-- Run this once in Supabase SQL Editor.

alter table public.profiles add column grade text;
alter table public.courses add column grade text;

-- Update the signup trigger so the grade (sent from the admin's create-user
-- form as user metadata) gets saved into the new profile automatically.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role, grade)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'New user'),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'student'),
    new.raw_user_meta_data->>'grade'
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;
