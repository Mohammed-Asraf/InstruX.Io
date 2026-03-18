-- Run this in your Supabase SQL Editor to create the credits table

create table if not exists user_credits (
  id           uuid        default gen_random_uuid() primary key,
  user_id      text        unique not null,
  credits      integer     not null default 5,
  total_builds integer     not null default 0,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

create index if not exists user_credits_user_id_idx on user_credits (user_id);

create or replace function update_updated_at_column()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists set_user_credits_updated_at on user_credits;
create trigger set_user_credits_updated_at
  before update on user_credits
  for each row execute function update_updated_at_column();
