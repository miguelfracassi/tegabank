-- Cole no Supabase: SQL Editor > New query > Run
-- ATENÇÃO: apaga as tabelas da versão anterior (profiles e transactions) e recria.

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop table if exists public.transactions;
drop table if exists public.profiles;

create table public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  full_name text not null,
  created_at timestamptz not null default now()
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  amount numeric(12,2) not null,            -- positivo = entrada, negativo = saída
  category text not null default 'Other',
  status text not null default 'completed' check (status in ('completed','pending','declined')),
  created_at timestamptz not null default now()
);
create index on public.transactions (user_id, created_at desc);

-- RLS ligado e SEM policies: ninguém acessa essas tabelas pela API pública do Supabase.
-- Só o servidor (que usa a DATABASE_URL) lê e escreve.
alter table public.users enable row level security;
alter table public.transactions enable row level security;
