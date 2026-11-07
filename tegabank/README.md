# Tega Bank

Site estático + API serverless na Vercel, com banco Postgres no Supabase.

## Estrutura (tudo precisa ficar na RAIZ do projeto)
index.html, login.html, home.html, payments.html, historico.html
style.css, site.css, app.js, favicon.svg, vercel.json, package.json
api/ (auth.js, me.js, logout.js, transactions.js, _lib.js)
schema.sql  (rodar uma vez no Supabase)

## Passo a passo
1. Supabase > SQL Editor: cole e rode o schema.sql.
2. Suba ESTES arquivos na RAIZ de um repositório do GitHub (não suba a pasta "tegabank" em si, suba o conteúdo dela).
3. Vercel > Add New > Project > importe o repositório. Framework Preset: Other. Root Directory: vazio. Build Command e Output Directory: deixe vazios.
4. Vercel > Settings > Environment Variables:
   - DATABASE_URL = postgresql://postgres.SEU-PROJETO:SENHA@aws-0-us-east-1.pooler.supabase.com:6543/postgres
     (se a senha tiver caracteres especiais, como #, troque por %23)
   - JWT_SECRET = texto aleatório longo
5. Deployments > Redeploy.

## Teste
Abra /style.css e /site.css no seu domínio. Se aparecer CSS, os arquivos estão no deploy.
