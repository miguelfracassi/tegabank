# Tega Bank

Site estático + API serverless na Vercel, com banco Postgres no Supabase.

## Estrutura (tudo na RAIZ do repositório)
index, login, home, payments, plans, historico, settings (.html)
style.css, site.css, app.js, favicon.svg, vercel.json, package.json
api/ (auth, me, logout, transactions, goals, budgets, account, _lib .js)
schema.sql (instalação nova) · upgrade.sql (adiciona metas e orçamentos)

## Atualizando um projeto que já funciona
1. Supabase > SQL Editor > cole e rode **upgrade.sql** (não apaga nada).
2. Substitua os arquivos no GitHub (inclusive a pasta api/) e apague api/health.js.
3. A Vercel faz o deploy sozinha. Depois Ctrl+F5.

## Instalação nova
Rode schema.sql e depois upgrade.sql. Variáveis: DATABASE_URL e JWT_SECRET.
