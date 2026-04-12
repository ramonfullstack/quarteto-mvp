# Quarteto MVP

MVP enxuto para cadastro de musicas, letras, tom e repertorios de um quarteto, com entrada direta no app e automacao pronta para GitHub Actions, Supabase e Vercel.

## O que ja vem pronto

- Entrada direta no app, sem autenticacao
- Lista de musicas com busca por titulo, letra, categoria e tags
- Cadastro, edicao e exclusao de musicas
- Lista de repertorios
- Criacao, edicao e exclusao de repertorios com ordenacao de musicas
- Layout responsivo para consulta rapida no celular
- Modo demo com dados locais no navegador
- Integracao preparada para Supabase
- Deploy automatico com GitHub Actions + Vercel CLI
- Banco automatizado com Supabase CLI e migrations versionadas

## Automacao pronta no GitHub

Este repositório agora tem quatro workflows:

- [`ci.yml`](./.github/workflows/ci.yml): roda `npm ci`, `npm run lint` e `npm run build`
- [`vercel-deploy.yml`](./.github/workflows/vercel-deploy.yml): faz deploy automatico na Vercel
- [`supabase-db.yml`](./.github/workflows/supabase-db.yml): aplica migrations no banco em push para `main`
- [`supabase-dry-run.yml`](./.github/workflows/supabase-dry-run.yml): valida migrations em pull request

## O que voce precisa configurar uma vez no GitHub

### Repository secrets

Adicione estes secrets em `Settings > Secrets and variables > Actions`:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `SUPABASE_DB_URL`

### Repository variables

Adicione estas variables em `Settings > Secrets and variables > Actions`:

- `NEXT_PUBLIC_DEMO_MODE`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Como isso funciona depois

### Frontend

- qualquer pull request dispara CI
- qualquer pull request tambem pode gerar preview deploy na Vercel
- qualquer push em `main` ou `master` dispara deploy de producao

### Banco

- qualquer push em `main` ou `master` com alteracao em `supabase/migrations/**` roda `supabase db push`
- qualquer pull request com alteracao em `supabase/migrations/**` roda `supabase db push --dry-run`

## Estrutura do banco

O schema original continua em [`supabase/schema.sql`](./supabase/schema.sql), mas a automacao agora usa a migration inicial versionada em [`supabase/migrations/20260411230000_init.sql`](./supabase/migrations/20260411230000_init.sql).

Para novas mudancas de banco, crie novos arquivos SQL em `supabase/migrations/`.

## Variaveis locais

Se o Supabase ja estiver criado, use `.env.local` assim:

```env
NEXT_PUBLIC_DEMO_MODE=false
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=SUA_CHAVE_ANON
```

Se quiser testar sem banco primeiro:

```env
NEXT_PUBLIC_DEMO_MODE=true
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Rodar localmente

1. Instale as dependencias:

```bash
npm install
```

2. Rode o projeto:

```bash
npm run dev
```

3. Abra `http://localhost:3000`.

Com `NEXT_PUBLIC_DEMO_MODE=true`, o app abre direto e os dados ficam no `localStorage` do navegador.

## Se o `next dev` quebrar com erro de manifest ou chunk faltando

Esta versao ja usa `next dev --webpack`, porque o Turbopack pode falhar em alguns ambientes com erros como `React Client Manifest` ou `Cannot find module './778.js'`.

Se o erro ja tiver ficado preso no cache, pare o servidor, apague a pasta `.next` e rode de novo:

```powershell
Remove-Item -LiteralPath .next -Recurse -Force
npm run dev
```

## Observacao sobre o schema

O arquivo [`supabase/schema.sql`](./supabase/schema.sql) libera acesso `anon` para simplificar o MVP sem login. Se depois voce quiser fechar o acesso, a proxima etapa natural e recolocar autenticacao e endurecer as policies de RLS.

## Validacao feita

```bash
npm run lint
npm run build
```

Os dois comandos passaram nesta versao inicial.
