-- Run this once in the Supabase SQL Editor for your project.
-- Public profile fields are display_name and country only; never expose emails.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null unique
    check (char_length(display_name) between 3 and 20)
    check (display_name ~ '^[A-Za-z0-9_]+$'),
  country text not null
    check (country ~ '^[A-Z]{2}$'),
  created_at timestamptz not null default now()
);

create table if not exists public.scores (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  score integer not null check (score >= 0),
  created_at timestamptz not null default now()
);

create index if not exists scores_leaderboard_idx
  on public.scores (score desc, created_at asc);
create index if not exists scores_user_idx
  on public.scores (user_id, score desc);

-- This public view intentionally exposes only display name, country, and best score.
create or replace view public.leaderboard as
  select
    profiles.display_name,
    profiles.country,
    max(scores.score)::integer as score
  from public.scores as scores
  join public.profiles as profiles on profiles.id = scores.user_id
  group by profiles.id, profiles.display_name, profiles.country;

-- Daily board resets at midnight UTC and shows each player's best score today.
create index if not exists scores_created_at_user_score_idx
  on public.scores (created_at desc, user_id, score desc);

create or replace view public.daily_leaderboard as
  select
    profiles.display_name,
    profiles.country,
    max(scores.score)::integer as score
  from public.scores as scores
  join public.profiles as profiles on profiles.id = scores.user_id
  where (scores.created_at at time zone 'UTC')::date = (now() at time zone 'UTC')::date
  group by profiles.id, profiles.display_name, profiles.country;

create or replace function public.create_slope_rush_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, country)
  values (
    new.id,
    new.raw_user_meta_data ->> 'display_name',
    upper(new.raw_user_meta_data ->> 'country')
  );
  return new;
end;
$$;

drop trigger if exists on_slope_rush_user_created on auth.users;
create trigger on_slope_rush_user_created
  after insert on auth.users
  for each row execute procedure public.create_slope_rush_profile();

alter table public.profiles enable row level security;
alter table public.scores enable row level security;

drop policy if exists "Anyone can view leaderboard profiles" on public.profiles;
drop policy if exists "Players can view their own profile" on public.profiles;
create policy "Players can view their own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "Anyone can view scores" on public.scores;
drop policy if exists "Players can view their own scores" on public.scores;
create policy "Players can view their own scores"
  on public.scores for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Players can submit their own scores" on public.scores;
create policy "Players can submit their own scores"
  on public.scores for insert
  to authenticated
  with check (auth.uid() = user_id);

revoke all on public.profiles from anon, authenticated;
revoke all on public.scores from anon, authenticated;
revoke all on public.leaderboard from anon, authenticated;
revoke all on public.daily_leaderboard from anon, authenticated;
grant select on public.profiles to authenticated;
grant select, insert on public.scores to authenticated;
grant select on public.leaderboard, public.daily_leaderboard to anon, authenticated;
grant usage, select on sequence public.scores_id_seq to authenticated;
