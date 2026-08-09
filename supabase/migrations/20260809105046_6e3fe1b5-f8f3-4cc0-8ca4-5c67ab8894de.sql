-- Roles
create type public.app_role as enum ('admin','student');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null default 'student',
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;

alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles where user_id = _user_id and role = _role
  )
$$;

create policy "read own roles" on public.user_roles
for select to authenticated
using (user_id = auth.uid());

create policy "admins read all roles" on public.user_roles
for select to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "admins manage roles" on public.user_roles
for all to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

-- Student profile fields
alter table public.profiles
  add column if not exists email text,
  add column if not exists student_id text,
  add column if not exists course text,
  add column if not exists semester_label text,
  add column if not exists section text,
  add column if not exists academic_year text,
  add column if not exists status text not null default 'active',
  add column if not exists last_login_at timestamptz;

create policy "admins read all profiles" on public.profiles
for select to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "admins update all profiles" on public.profiles
for update to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

-- default role on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
BEGIN
  INSERT INTO public.profiles (id, display_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)), NEW.email)
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $function$;