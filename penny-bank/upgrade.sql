-- Rode UMA vez no Supabase (SQL Editor). Só ADICIONA tabelas, não apaga nada.
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  target numeric(12,2) not null check (target > 0),
  saved numeric(12,2) not null default 0 check (saved >= 0),
  created_at timestamptz not null default now()
);
create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  category text not null,
  amount numeric(12,2) not null check (amount > 0),
  unique (user_id, category)
);
alter table public.goals enable row level security;
alter table public.budgets enable row level security;
