-- Flow Task Tracker Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  display_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- App state table (stores all user data)
create table if not exists public.app_state (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null unique,
  current_day jsonb not null default '{}'::jsonb,
  task_library jsonb not null default '[]'::jsonb,
  archive jsonb not null default '[]'::jsonb,
  active_day_session jsonb,
  active_task_timer jsonb,
  active_goal_plan jsonb,
  goal_plan_index jsonb not null default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Goal plans table (separate storage for goal plans)
create table if not exists public.goal_plans (
  id text primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  data jsonb not null,
  is_active boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes for better query performance
create index if not exists app_state_user_id_idx on public.app_state(user_id);
create index if not exists goal_plans_user_id_idx on public.goal_plans(user_id);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.app_state enable row level security;
alter table public.goal_plans enable row level security;

-- RLS Policies for profiles
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- RLS Policies for app_state
create policy "Users can view their own app state"
  on public.app_state for select
  using (auth.uid() = user_id);

create policy "Users can insert their own app state"
  on public.app_state for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own app state"
  on public.app_state for update
  using (auth.uid() = user_id);

create policy "Users can delete their own app state"
  on public.app_state for delete
  using (auth.uid() = user_id);

-- RLS Policies for goal_plans
create policy "Users can view their own goal plans"
  on public.goal_plans for select
  using (auth.uid() = user_id);

create policy "Users can insert their own goal plans"
  on public.goal_plans for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own goal plans"
  on public.goal_plans for update
  using (auth.uid() = user_id);

create policy "Users can delete their own goal plans"
  on public.goal_plans for delete
  using (auth.uid() = user_id);

-- Function to automatically create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create profile on signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to update updated_at timestamp
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Triggers to auto-update updated_at
create trigger update_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.update_updated_at_column();

create trigger update_app_state_updated_at
  before update on public.app_state
  for each row execute procedure public.update_updated_at_column();

create trigger update_goal_plans_updated_at
  before update on public.goal_plans
  for each row execute procedure public.update_updated_at_column();
