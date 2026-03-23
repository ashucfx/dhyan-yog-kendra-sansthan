create table if not exists public.submissions (
  id uuid primary key,
  name text not null,
  country_iso text not null,
  country_name text not null,
  country_code text not null,
  phone text not null,
  phone_national text not null,
  email text not null,
  blood_group text not null,
  condition text not null,
  batch_type text not null,
  goal text not null,
  notes text default '',
  created_at timestamptz not null default now()
);

alter table public.submissions add column if not exists country_iso text;
alter table public.submissions add column if not exists country_name text;
alter table public.submissions add column if not exists country_code text;
alter table public.submissions add column if not exists phone_national text;

update public.submissions
set
  country_iso = coalesce(nullif(country_iso, ''), 'IN'),
  country_name = coalesce(nullif(country_name, ''), 'India'),
  country_code = coalesce(nullif(country_code, ''), '+91'),
  phone_national = coalesce(nullif(phone_national, ''), regexp_replace(phone, '^\+\d+\s*', ''))
where
  country_iso is null
  or country_name is null
  or country_code is null
  or phone_national is null;

alter table public.submissions alter column country_iso set not null;
alter table public.submissions alter column country_name set not null;
alter table public.submissions alter column country_code set not null;
alter table public.submissions alter column phone_national set not null;

create index if not exists submissions_created_at_idx on public.submissions (created_at desc);
