# Yamilook

**Tagline:** *A vida como ela é.*

Yamilook é uma rede social mobile-first focada na cultura angolana e da diáspora africana, com feed, chamadas, lives, papos, ritmos e mais.

## Stack

- **Vite** + **React 18** + **TypeScript**
- **Tailwind CSS** + **shadcn/ui** + **Radix UI**
- **Supabase** (auth, base de dados, storage, edge functions, realtime)
- **LiveKit** (streaming áudio/vídeo em direto)
- **Capacitor** (build Android/iOS)
- **i18next** (12 idiomas, incluindo pt-AO, Kimbundu, Umbundu, Lingala, Kikongo, Swahili)

## Pré-requisitos

- Node.js 20+ (recomendado: nvm)
- npm ou bun
- Conta Supabase com um projeto provisionado

## Configuração

1. Instalar dependências:

   ```sh
   npm install
   ```

2. Criar `.env` na raiz com as credenciais do teu projeto Supabase:

   ```env
   VITE_SUPABASE_URL=https://<project-ref>.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=<anon-key>
   VITE_SUPABASE_PROJECT_ID=<project-ref>
   ```

3. Aplicar as migrações em `supabase/migrations/` ao teu projeto via Supabase CLI.

4. Iniciar o dev server:

   ```sh
   npm run dev
   ```

## Scripts

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Dev server Vite |
| `npm run build` | Build de produção |
| `npm run preview` | Pré-visualizar build |
| `npm run lint` | ESLint |

## Estrutura

```
src/
  components/      Componentes partilhados (UI, feed, chat, calls, live...)
  features/        Módulos de produto (academia, kumbu, mokubico, momambo)
  hooks/           Hooks de domínio (useAuth, useCalls, useWebRTC, ...)
  pages/           Rotas top-level
  i18n/            Traduções
  integrations/    Cliente Supabase gerado
supabase/
  functions/       Edge Functions Deno
  migrations/      SQL migrations
```

## Build mobile (Capacitor)

```sh
npm run build
npx cap sync
npx cap open android   # ou ios
```

## Licença

Proprietary © Yamilook.
