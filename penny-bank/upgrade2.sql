-- Rode UMA vez no Supabase (SQL Editor). Só ADICIONA a coluna "active" (ativar/desativar). Não apaga nada.
-- (A API também faz isso sozinha na primeira chamada; este arquivo é só para garantir.)
alter table public.transactions add column if not exists active boolean not null default true;
alter table public.goals        add column if not exists active boolean not null default true;
alter table public.budgets      add column if not exists active boolean not null default true;
