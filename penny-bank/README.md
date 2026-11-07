# Penny Bank

Site estático + API serverless na Vercel, com banco Postgres no Supabase.

## Estrutura (tudo na RAIZ do repositório)
index, login, home, payments, plans, historico, settings (.html)
style.css, site.css, app.js, favicon.svg, vercel.json, package.json
api/ (auth, me, logout, transactions, goals, budgets, account, _lib .js)
schema.sql (instalação nova) · upgrade.sql (metas e orçamentos) · upgrade2.sql (ativar/desativar)

## Atualizando um projeto que já funciona
1. Supabase > SQL Editor > cole e rode **upgrade.sql** (se ainda não rodou) e depois **upgrade2.sql** (não apagam nada).
   (A API também cria a coluna `active` sozinha na primeira chamada, mas rodar o upgrade2.sql garante.)
2. Substitua os arquivos no GitHub (inclusive a pasta api/) e apague api/health.js.
3. A Vercel faz o deploy sozinha. Depois Ctrl+F5.

## Instalação nova
Rode schema.sql, depois upgrade.sql e upgrade2.sql. Variáveis: DATABASE_URL e JWT_SECRET.

## O que dá para fazer agora
- **Tema claro/escuro** em todas as páginas (botão do topo e em Settings), troca na hora e fica salvo.
- **Transações** (History): editar, desativar/ativar (some dos saldos e gráficos, mas continua na lista) e excluir.
- **Metas e orçamentos** (Plans): editar, desativar/ativar e excluir. Meta desativada não aceita Add/Withdraw.
