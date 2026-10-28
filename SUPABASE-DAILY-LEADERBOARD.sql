-- Run this once in the Supabase SQL Editor to add the daily and hourly leaderboards
-- to an existing Slope Rush database. The daily board resets at midnight UTC;
-- the hourly board uses a rolling one-hour window.

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

revoke all on public.daily_leaderboard from anon, authenticated;
grant select on public.daily_leaderboard to anon, authenticated;

create or replace view public.hourly_leaderboard as
  select
    profiles.display_name,
    profiles.country,
    max(scores.score)::integer as score
  from public.scores as scores
  join public.profiles as profiles on profiles.id = scores.user_id
  where scores.created_at >= now() - interval '1 hour'
  group by profiles.id, profiles.display_name, profiles.country;

revoke all on public.hourly_leaderboard from anon, authenticated;
grant select on public.hourly_leaderboard to anon, authenticated;
