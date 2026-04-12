# Quarteto MVP

MVP enxuto para cadastro de musicas, letras, tom e repertorios de um quarteto, pronto para subir no Vercel e conectar no Supabase sem exigir tela de login.

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

## Variaveis de ambiente

Copie `.env.example` para `.env.local`.

### Modo demo

```env
NEXT_PUBLIC_DEMO_MODE=true
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

### Modo Supabase

```env
NEXT_PUBLIC_DEMO_MODE=false
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=SUA_CHAVE_ANON
```

## Setup do Supabase

1. Crie um projeto no Supabase.
2. Abra o SQL Editor.
3. Rode o arquivo [`supabase/schema.sql`](./supabase/schema.sql).
4. Preencha `.env.local` com a URL e a anon key.
5. O schema desta versao libera acesso `anon` para simplificar o MVP sem login.

Se depois voce quiser fechar o acesso, a etapa natural e recolocar autenticacao e endurecer as policies de RLS.

## Deploy no Vercel

1. Suba este repositorio para o GitHub.
2. Importe o repositorio na Vercel.
3. Configure as variaveis de ambiente do `.env.local`.
4. Clique em deploy.

No primeiro teste, voce pode publicar em modo demo. Quando quiser dados reais compartilhados entre o grupo, ligue o Supabase.

## Validacao feita

```bash
npm run lint
npm run build
```

Os dois comandos passaram nesta versao inicial.
