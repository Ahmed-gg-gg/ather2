-- Run this once in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run

create type user_role as enum ('student', 'teacher', 'parent', 'admin');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role user_role not null default 'student',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Automatically create a profile row whenever someone signs up.
-- Role and name are passed in from the signup form as user metadata.
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'New user'),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'student')
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- ONE-TIME STEP: create your own admin account
-- 1. Go to Supabase -> Authentication -> Users -> Add user
--    (enter your email + a password, tick "Auto confirm user")
-- 2. Then run this, replacing the email with the one you used:
--
-- update public.profiles set role = 'admin', full_name = 'اسمك'
-- where id = (select id from auth.users where email = 'you@example.com');
-- ============================================================
