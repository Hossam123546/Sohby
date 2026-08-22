create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  username varchar(30) not null unique,
  email varchar(255) not null unique,
  password_hash text not null,
  display_name varchar(80) not null,
  bio varchar(280) not null default '',
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  content varchar(1000) not null,
  created_at timestamptz not null default now()
);

create index if not exists posts_created_at_idx on posts(created_at desc);
create index if not exists sessions_token_hash_idx on sessions(token_hash);

create table if not exists follows (
  follower_id uuid not null references users(id) on delete cascade,
  following_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);
