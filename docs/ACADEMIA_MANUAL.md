# Manual da Academia da Banda — YamiLook

> Documento de referência interno sobre a funcionalidade completa da Academia da Banda: conceito, arquitectura, fluxos de utilizador, modelo de dados e regras de negócio.

---

## 1. Visão Geral

A **Academia da Banda** é o módulo de aprendizagem e mentoria da plataforma YamiLook. Permite que membros da comunidade partilhem conhecimento através de sessões ao vivo (1:1, grupo ou masterclass), cobradas em Kumbu coins ou gratuitas.

### 1.1 Objectivos

| Objectivo | Descrição |
|-----------|-----------|
| **Crescimento** | Permitir que a banda cresça através da partilha de conhecimento |
| **Credibilidade** | Construir reputação para mentores através de avaliações e sessões |
| **Monetização** | Permitir que Verified Creators cobrem em Kumbu coins |
| **Comunidade** | Fomentar relações mentor-aluno dentro das bandas |

### 1.2 Acesso

| Papel | Permissões |
|-------|-----------|
| **Qualquer utilizador autenticado** | Ver sessões, reservar, participar, avaliar |
| **Mentor** | Criar sessões, gerir as suas sessões |
| **Verified Creator** | Cobrar Kumbu coins em sessões premium |
| **Admin** | Gestão global de sessões (via painel admin) |

---

## 2. Arquitectura Técnica

### 2.1 Estrutura de Ficheiros

```
src/features/academia/
├── index.ts                          # Exports públicos do módulo
├── copy.ts                           # Strings de UI (ACADEMIA_COPY)
├── mocks.ts                          # Dados mock para mentores (carrossel)
├── hooks/
│   └── useAcademia.ts                # Hooks React Query (sessions, create)
├── components/
│   ├── SessionCard.tsx               # Cartão de sessão reutilizável
│   ├── MentorCard.tsx                # Cartão de mentor (carrossel)
│   └── ReviewModal.tsx               # Modal de avaliação pós-sessão
└── routes/
    ├── AcademiaHome.tsx              # Ecrã principal (/academia)
    ├── AcademiaSession.tsx           # Detalhe de sessão (/academia/:sessionId)
    ├── AcademiaCreateSession.tsx     # Wizard de criação (/academia/create)
    ├── AcademiaLiveRoom.tsx          # Sala ao vivo (/academia/live/:sessionId)
    └── MentorProfileScreen.tsx       # Perfil de mentor (/academia/mentor/:mentorId)
```

### 2.2 Rotas

| Rota | Componente | Protegida | Descrição |
|------|-----------|-----------|-----------|
| `/academia` | `AcademiaHome` | ✅ | Ecrã principal com sessões e mentores |
| `/academia/create` | `AcademiaCreateSession` | ✅ | Wizard de criação de sessão |
| `/academia/:sessionId` | `AcademiaSession` | ✅ | Detalhe e reserva de sessão |
| `/academia/live/:sessionId` | `AcademiaLiveRoom` | ✅ | Sala de sessão ao vivo |
| `/academia/mentor/:mentorId` | `MentorProfileScreen` | ✅ | Perfil resumido do mentor |

### 2.3 Modelo de Dados

#### Tabela `academia_sessions`

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | uuid | ❌ | `gen_random_uuid()` | PK |
| `mentor_id` | uuid | ❌ | — | FK → `profiles.id` (quem criou) |
| `banda_id` | uuid | ✅ | — | FK → `bandas.id` (auto via trigger) |
| `title` | text | ❌ | — | Título da sessão |
| `description` | text | ✅ | — | Descrição opcional |
| `format` | text | ❌ | `'grupo'` | `'1:1'`, `'grupo'` ou `'masterclass'` |
| `spots` | integer | ❌ | `20` | Total de vagas |
| `spots_left` | integer | ❌ | `20` | Vagas restantes (decrementado via trigger) |
| `price_coins` | integer | ❌ | `0` | Preço em Kumbu coins (0 = gratuita) |
| `status` | text | ❌ | `'scheduled'` | `'scheduled'`, `'live'`, `'ended'` |
| `scheduled_at` | timestamptz | ❌ | — | Data/hora agendada |
| `created_at` | timestamptz | ❌ | `now()` | — |
| `updated_at` | timestamptz | ❌ | `now()` | — |

#### Tabela `academia_reservations`

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | uuid | ❌ | `gen_random_uuid()` | PK |
| `session_id` | uuid | ❌ | — | FK → `academia_sessions.id` |
| `user_id` | uuid | ❌ | — | Quem reservou |
| `created_at` | timestamptz | ❌ | `now()` | — |

**Constraint:** `UNIQUE(session_id, user_id)` — um utilizador só pode reservar uma vez.

#### Tabela `mentor_profiles`

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | uuid | ❌ | `gen_random_uuid()` | PK |
| `user_id` | uuid | ❌ | — | FK → `profiles.id` (UNIQUE) |
| `specialty` | text | ❌ | `''` | Área de expertise |
| `mentor_bio` | text | ✅ | — | Bio específica de mentor |
| `is_verified_mentor` | boolean | ❌ | `false` | Mentor verificado |
| `created_at` | timestamptz | ❌ | `now()` | — |
| `updated_at` | timestamptz | ❌ | `now()` | — |

**Trigger:** `trg_ensure_mentor_profile` — criado automaticamente ao inserir uma sessão na `academia_sessions`.

#### Tabela `academia_reviews`

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | uuid | ❌ | `gen_random_uuid()` | PK |
| `session_id` | uuid | ❌ | — | FK → `academia_sessions.id` |
| `mentor_id` | uuid | ❌ | — | O mentor avaliado |
| `reviewer_id` | uuid | ❌ | — | Quem avaliou |
| `rating` | integer | ❌ | — | 1 a 5 estrelas |
| `comment` | text | ✅ | — | Comentário opcional |
| `created_at` | timestamptz | ❌ | `now()` | — |

**Constraint:** `UNIQUE(session_id, reviewer_id)` — uma review por sessão por utilizador.

### 2.4 Triggers e Funções

| Trigger/Função | Tabela | Descrição |
|----------------|--------|-----------|
| `update_academia_spots_on_reserve()` | `academia_reservations` | Decrementa `spots_left` no INSERT, incrementa no DELETE |
| `set_academia_session_banda()` | `academia_sessions` | Auto-preenche `banda_id` com a banda activa do mentor |
| `ensure_mentor_profile()` | `academia_sessions` | Cria `mentor_profiles` automaticamente ao criar sessão |

### 2.5 RLS (Row Level Security)

#### `academia_sessions`
- SELECT: Utilizadores autenticados podem ver todas as sessões
- INSERT: Utilizadores autenticados podem criar (como mentor)

#### `academia_reservations`
- SELECT: Utilizadores autenticados podem ver as suas reservas
- INSERT: Utilizadores autenticados podem reservar
- DELETE: Utilizadores autenticados podem cancelar as suas reservas

#### `mentor_profiles`
- SELECT: Todos os autenticados podem ver perfis de mentores
- INSERT: Cada um pode criar o seu próprio perfil de mentor
- UPDATE: Cada um pode editar o seu próprio perfil de mentor

#### `academia_reviews`
- SELECT: Todos os autenticados podem ver avaliações
- INSERT: Cada um pode criar avaliações (como reviewer)
- UPDATE: Cada um pode editar as suas próprias avaliações

---

## 3. Fluxos de Utilizador

### 3.1 Criação de Sessão (Wizard de 4 Passos)

```
/academia → Botão "+ Criar sessão" → /academia/create
    ↓
PASSO 1: Título
  - Input obrigatório (mín. 3 caracteres, máx. 100)
  - Placeholder: "Ex.: Produção musical com Ableton"
    ↓
PASSO 2: Descrição
  - Textarea opcional (máx. 500 caracteres)
  - Placeholder contextual sobre conteúdo
    ↓
PASSO 3: Formato
  - 🎯 1:1 → sessão privada, 1 vaga (auto)
  - 👥 Grupo → para a banda toda, número de vagas configurável
  - 🎓 Masterclass → apresentação aberta, número de vagas configurável
  - Se formato != 1:1 → input de número de lugares (2-100)
    ↓
PASSO 4: Detalhes Finais
  - Preço em Kumbu coins (0 = gratuita)
  - ⚠️ Se preço > 0 → aviso "Precisas de verificação para cobrar"
  - Data e hora (datetime-local input)
  - Pré-visualização do cartão da sessão
    ↓
"Publicar sessão"
  - INSERT em academia_sessions
  - Trigger auto-preenche banda_id e cria mentor_profiles
  - Redireciona para /academia
  - Toast: "Sessão criada!"
```

### 3.2 Reserva de Sessão

```
/academia → Clicar num SessionCard → /academia/:sessionId
    ↓
Ecrã de detalhe mostra:
  - Perfil do mentor (clicável → /academia/mentor/:mentorId)
  - Título e descrição
  - Grelha de info: Data, Hora, Formato, Lugares (X/Y)
  - Badges: Premium/Gratuita, ✓ Reservado
    ↓
CASOS:
  a) Sessão normal, não reservada → Botão "Reservar"
     - INSERT em academia_reservations
     - Trigger decrementa spots_left
     - Toast: "Lugar reservado com sucesso!"

  b) Já reservada → Botão "Cancelar reserva"
     - DELETE de academia_reservations
     - Trigger incrementa spots_left
     - Toast: "Reserva cancelada."

  c) Sessão lotada → Botão "Lotado" (disabled)

  d) É o mentor → Botão "É a tua sessão" (disabled)

  e) Sessão ao vivo → Botão vermelho "Entrar" → /academia/live/:sessionId

  f) Sessão terminada → Nota "Esta sessão já terminou."
```

### 3.3 Regras de Negócio — Inscrições

| Regra | Condição | Comportamento |
|-------|----------|---------------|
| **Inscrição normal** | `now < scheduledAt - 5min` | Reserva ao preço normal |
| **Inscrição tardia** | `scheduledAt - 5min ≤ now < scheduledAt` E `isPremium` | Sobretaxa de +10% sobre o preço em coins |
| **Inscrição tardia (grátis)** | `scheduledAt - 5min ≤ now < scheduledAt` E `!isPremium` | Sem sobretaxa (sessões gratuitas isentas) |
| **Inscrições encerradas** | `now ≥ scheduledAt` E `status != 'live'` | Botão disabled "Inscrições encerradas" |
| **Sessão terminada** | `status === 'ended'` | Apenas nota informativa, sem botão |

### 3.4 Sala ao Vivo

```
/academia/live/:sessionId
    ↓
Ecrã com:
  - Header com título e badge "AO VIVO" (pulsante)
  - Área de vídeo (placeholder "LiveKit Video Area")
  - Tabs: Pessoas | Chat
    ↓
Se NÃO é mentor → Botão "Sair da sessão"
Se É mentor → Botão "Encerrar"
  - Ao encerrar: exibe "Sessão terminada"
  - Se aluno: abre ReviewModal automaticamente
```

### 3.5 Avaliação (ReviewModal)

```
Após sessão terminar (para alunos):
    ↓
Dialog com:
  - Título: "Como foi esta Mentoria?"
  - Pergunta: "Valeu a pena?"
  - 5 estrelas (obrigatório selecionar pelo menos 1)
  - Textarea opcional: "Deixa um comentário"
    ↓
  Botões: "Agora não" | "Enviar"
    ↓
  INSERT em academia_reviews
    (session_id, mentor_id, reviewer_id, rating, comment)
```

### 3.6 Perfil de Mentor

```
Clicar no mentor (sessão detalhe ou carrossel)
    → /academia/mentor/:mentorId
    ↓
Ecrã resumido com:
  - Avatar com anel gradiente + badge verificado
  - Nome + especialidade (badge)
  - Bio de mentor (específica, diferente da bio geral)
    ↓
Estatísticas:
  - ⭐ Avaliação média (calculada das reviews)
  - 📅 Total de sessões criadas
  - 👥 Número de reviews
    ↓
Próximas Sessões:
  - Lista de sessões com status 'scheduled'
  - Clicável → navega para detalhe da sessão
    ↓
Sessões Anteriores:
  - Últimas 5 sessões com status 'ended'
    ↓
Avaliações:
  - Lista de reviews com estrelas, nome do reviewer, comentário e data
  - Ordenadas por data (mais recente primeiro)
  - Máximo 20 reviews
```

---

## 4. Componentes UI

### 4.1 SessionCard

Cartão reutilizável para listar sessões. Exibe:

| Elemento | Descrição |
|----------|-----------|
| **Título** | Nome da sessão (truncado se necessário) |
| **Mentor** | Avatar miniatura + nome |
| **Badges** | 🔴 AO VIVO (pulsante), 👑 Premium / ✅ Gratuita |
| **Meta** | Formato (badge), Data, Hora, Preço (se premium) |
| **Barra de progresso** | Ocupação visual (vagas preenchidas/total) |
| **"Quase cheio!"** | Texto animado quando ≤ 3 vagas restantes |
| **CTA** | "Reservar" / "Entrar" / "Inscrições encerradas" / info terminada |

### 4.2 MentorCard

Cartão compacto para carrossel horizontal. Exibe:

| Elemento | Descrição |
|----------|-----------|
| **Avatar** | Com anel gradiente (from-primary/60 to-primary/20) |
| **Verificado** | Badge CheckCircle2 no canto inferior direito |
| **Nome** | Texto bold, truncado |
| **Especialidade** | Badge secondary |
| **Stats** | ⭐ Rating | Nº sessões |

### 4.3 ReviewModal

Dialog centrado com:
- 5 estrelas interactivas (fill-primary quando seleccionadas)
- Textarea para comentário
- Botões "Agora não" e "Enviar"

---

## 5. Ecrã Principal (AcademiaHome)

### 5.1 Layout

```
┌─────────────────────────────────────┐
│ 🎓 ACADEMIA DA BANDA    [+ Criar]  │  ← Header sticky
├─────────────────────────────────────┤
│ ✨ Cresce com a tua banda           │  ← Hero card
│    Na Academia a banda cresce.      │
│    📈 8 sessões | 4 mentores        │
├─────────────────────────────────────┤
│ 🔴 AO VIVO AGORA                   │  ← Só se houver sessões live
│    [SessionCard live]               │
├─────────────────────────────────────┤
│ MENTORES          4 disponíveis     │
│ [MentorCard] [MentorCard] [→]       │  ← Scroll horizontal
├─────────────────────────────────────┤
│ [Todas] [Gratuitas] [Premium]       │  ← Tabs de filtro
│    [SessionCard]                    │
│    [SessionCard]                    │
│    ...                              │
├─────────────────────────────────────┤
│ 🎵  🏠  🎓  💬  👤                │  ← BottomNav
└─────────────────────────────────────┘
```

### 5.2 Animações

- Hero card: fade-in + slide-up (0.5s)
- Secção live: delay 0.1s
- Carrossel mentores: delay 0.2s
- Sessões: delay 0.3s
- SessionCard: `whileTap={{ scale: 0.98 }}`
- MentorCard: `whileTap={{ scale: 0.96 }}`

---

## 6. UI Copy (ACADEMIA_COPY)

Todas as strings de UI estão centralizadas em `src/features/academia/copy.ts`:

| Key | Valor |
|-----|-------|
| `title` | ACADEMIA DA BANDA |
| `subtitle` | Na Academia a banda cresce. |
| `tabAll` | Todas |
| `tabFree` | Gratuitas |
| `tabPremium` | Premium |
| `createSession` | Criar sessão |
| `reserve` | Reservar |
| `enter` | Entrar |
| `close` | Encerrar |
| `feedbackTitle` | Como foi esta Mentoria? |
| `feedbackQuestion` | Valeu a pena? |
| `feedbackDismiss` | Agora não |
| `feedbackSubmit` | Enviar |
| `verificationWarning` | Precisas de verificação para cobrar. |
| `sessionEnded` | Sessão terminada |
| `reviewMentor` | Avaliar mentor |
| `liveNow` | Ao vivo agora |
| `scheduled` | Agendada |
| `ended` | Terminada |
| `mentors` | Mentores |
| `people` | Pessoas |
| `chat` | Chat |
| `liveVideoArea` | LiveKit Video Area |
| `format1on1` | 1:1 |
| `formatGroup` | Grupo |
| `formatMasterclass` | Masterclass |
| `lateRegistration` | Inscrição tardia (+10%) |
| `registrationClosed` | Inscrições encerradas |
| `sessionEndedInfo` | Esta sessão já terminou. |

---

## 7. Integração com Kumbu

| Acção | Kumbu | Limite |
|-------|-------|--------|
| **Assistir a sessão** | +5 Kumbu | 1×/dia (`academia_session`) |
| **Criar sessão** | (sem reward directo) | — |
| **Sessão premium (preço)** | Cobrado ao aluno via `kumbu_spend` | — |
| **Inscrição tardia** | Preço × 1.10 (arredondado) | Apenas sessões premium |

---

## 8. Integração com o Perfil

O perfil do utilizador (`/profile/:userId`) inclui métricas da Academia:

| Métrica | Fonte | Descrição |
|---------|-------|-----------|
| `sessionsCreated` | `COUNT(academia_sessions WHERE mentor_id = userId)` | Sessões criadas como mentor |
| `sessionsAttended` | `COUNT(academia_reservations WHERE user_id = userId)` | Sessões assistidas como aluno |

Estas métricas aparecem na secção **ProfileContributions** do perfil reputacional.

---

## 9. Identidade Visual

### 9.1 Princípios

- Tom **premium e credível**, focado em crescimento
- Ícone principal: `GraduationCap` (lucide)
- Cor predominante: `primary` (dourado — HSL definido no design system)

### 9.2 Elementos Visuais Chave

| Elemento | Estilo |
|----------|--------|
| **Hero card** | `rounded-2xl border-border/30 bg-card` com blurs decorativos |
| **Avatar mentor (carrossel)** | Anel gradiente `from-primary/60 to-primary/20` |
| **Badge Premium** | `bg-primary/15 text-primary` com ícone Crown |
| **Badge Gratuita** | `bg-success/15 text-success` |
| **Badge AO VIVO** | `bg-destructive/15 text-destructive` com dot pulsante |
| **Barra de ocupação** | `bg-secondary` com fill `bg-primary/60` (ou `bg-primary` se quase cheio) |
| **Step indicator (wizard)** | Ícones em círculos com estados: activo (primary), completo (success), pendente (muted) |

### 9.3 Glassmorphism

Headers utilizam a classe `glass-nav` para efeito blur:
- `bg-background/80 backdrop-blur-md`
- Borda inferior sutil `border-border/40`

---

## 10. Limitações Conhecidas e Próximos Passos

### 10.1 Estado Actual

| Item | Estado |
|------|--------|
| Criação de sessões | ✅ Funcional (Supabase) |
| Reserva/cancelamento | ✅ Funcional (Supabase) |
| Detalhe de sessão | ✅ Funcional (Supabase) |
| Perfil de mentor | ✅ Funcional (Supabase) |
| Reviews de alunos | ✅ Schema criado, UI do modal existe |
| Carrossel de mentores | ⚠️ Usa dados mock (MOCK_MENTORS) |
| Sala ao vivo (vídeo) | ⚠️ Placeholder — LiveKit não integrado |
| Chat da sessão | ⚠️ Placeholder |
| Cobrança Kumbu coins | ⚠️ Lógica de spend não integrada na reserva |
| Edição de mentor_profile | ⚠️ Tabela existe, sem UI de edição |

### 10.2 Próximos Passos Sugeridos

1. **Substituir MOCK_MENTORS por dados reais** — query `mentor_profiles` JOIN `profiles` para o carrossel
2. **Integrar LiveKit** na sala ao vivo para vídeo real
3. **Implementar cobrança Kumbu** na reserva de sessões premium (`kumbu_spend`)
4. **Criar UI para edição de mentor_profile** (especialidade, bio de mentor)
5. **Integrar ReviewModal com Supabase** (INSERT em `academia_reviews`)
6. **Notificações** — avisar mentor quando há nova reserva
7. **Contagem de mentores dinâmica** — substituir `MOCK_MENTORS.length` no hero

---

## 11. Glossário

| Termo | Significado |
|-------|-------------|
| **Banda** | Comunidade/grupo a que o utilizador pertence |
| **Kumbu** | Moeda virtual da plataforma |
| **Mentor** | Utilizador que cria e lidera sessões |
| **Sessão** | Evento de aprendizagem agendado |
| **Reserva** | Inscrição de um aluno numa sessão |
| **Roda** | Sessão de performance (Palco, não Academia) |
| **Verified Creator** | Nível de conta com permissão para monetizar |
| **Inscrição tardia** | Reserva nos últimos 5 min antes do início (+10% em premium) |

---

*Última actualização: 14 de Março de 2026*
