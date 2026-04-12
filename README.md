# Quarteto MVP

MVP enxuto para cadastro de musicas, letras, tom e repertorios de um quarteto, pronto para subir no GitHub, conectar no Supabase e publicar na Vercel sem login no app.

## O que ja vem pronto

- Entrada direta no app, sem autenticacao
- Lista de musicas com busca por titulo, letra, categoria e tags
- Cadastro, edicao e exclusao de musicas
- Lista de repertorios
- Criacao, edicao e exclusao de repertorios com ordenacao de musicas
- Layout responsivo para consulta rapida no celular
- Modo demo com dados locais no navegador
- Integracao preparada para Supabase
- Workflow de CI no GitHub Actions

## Fluxo mais simples com MCP

### 1. Supabase MCP

Use o MCP oficial da Supabase para criar o projeto e aplicar o schema automaticamente.

Referencia oficial:
https://supabase.com/mcp

Objetivo:
- criar o projeto
- aplicar [`supabase/schema.sql`](./supabase/schema.sql)
- retornar `NEXT_PUBLIC_SUPABASE_URL`
- retornar `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2. Vercel MCP

Use o MCP oficial da Vercel para criar o projeto e publicar o repositório do GitHub.

Referencia oficial:
https://vercel.com/docs/ai-resources/vercel-mcp

Objetivo:
- importar `ramonfullstack/quarteto-mvp`
- configurar variaveis de ambiente
- fazer o primeiro deploy

### 3. Variaveis de ambiente

Depois que o MCP da Supabase devolver os dados, crie `.env.local` com:

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
