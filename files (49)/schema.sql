-- Cole no Supabase: SQL Editor > New query > Run

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text not null,
  created_at timestamptz default now()
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  title text not null,
  amount numeric(12,2) not null,            -- positivo = entrada, negativo = saída
  category text not null default 'Other',
  status text not null default 'completed' check (status in ('completed','pending','declined')),
  created_at timestamptz not null default now()
);

create index on public.transactions (user_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.transactions enable row level security;

create policy "own profile read"   on public.profiles for select using (auth.uid() = id);
create policy "own profile update" on public.profiles for update using (auth.uid() = id);
create policy "own tx read"   on public.transactions for select using (auth.uid() = user_id);
create policy "own tx insert" on public.transactions for insert with check (auth.uid() = user_id);
create policy "own tx delete" on public.transactions for delete using (auth.uid() = user_id);

-- Cria o perfil automaticamente quando alguém se cadastra
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', 'New user'));
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();
