# PALCO Feature - Complete Data Model & Architecture Export

Generated: 2026-02-04

## Overview

**PALCO** is a premium Q&A and live streaming feature within Yamilook. It enables "Guides" (mentors/experts) to create interactive stages where audiences can submit paid questions ("Vozes") to be answered during live "Roda" sessions.

### Theme Categories

Palcos are now integrated with the `discover_topics` system, providing 24 African-centric categories including:
- **Música**: Kuduro, Afrobeat, Semba & Kizomba
- **Entretenimento**: Humor da Banda, Palco, Gaming
- **Estilo de Vida**: Moda & Estilo, Beleza, Fitness
- **Sociedade**: Educação & Dicas, Bizno da Banda, Oportunidades
- **Cultura**: Espiritualidade, Família, Relacionamentos
- **Desporto**: Futebol & Rua, Motores
- **Criatividade**: Fotografia, Arte, Música

Each theme has localized names/descriptions and custom imagery.

---

## 1. DATABASE SCHEMA

### Core Tables

#### 1.1 `palcos` - Main Stages Table
```sql
CREATE TABLE public.palcos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID NOT NULL REFERENCES profiles(id),
  title TEXT NOT NULL,
  theme TEXT,                                 -- Now references discover_topics.slug
  description TEXT,
  cover_url TEXT,
  language TEXT DEFAULT 'PT',
  location TEXT,
  tags TEXT[],
  visibility TEXT DEFAULT 'public',        -- 'public' | 'private' | 'unlisted'
  status TEXT DEFAULT 'draft',              -- 'draft' | 'scheduled' | 'live' | 'ended' | 'archived'
  palco_type palco_type DEFAULT 'standard', -- enum: 'standard' | 'premium'
  artistic_category artistic_category,      -- enum for premium palcos
  max_voices_per_roda INTEGER,
  allow_custom_voice_text BOOLEAN DEFAULT true,
  allow_ai_assist BOOLEAN DEFAULT false,
  allow_custom_pricing BOOLEAN,
  min_price NUMERIC,
  suggested_min_price NUMERIC,
  suggested_max_price NUMERIC,
  total_rodas INTEGER DEFAULT 0,
  total_voices INTEGER DEFAULT 0,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### 1.2 `rodas` - Live Sessions Table
```sql
CREATE TABLE public.rodas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  palco_id UUID NOT NULL REFERENCES palcos(id),
  title TEXT,
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  phase TEXT DEFAULT 'scheduled',           -- 'scheduled' | 'content' | 'qa' | 'ended'
  qa_start_at TIMESTAMPTZ,
  livekit_room_name TEXT,
  viewer_count INTEGER DEFAULT 0,
  peak_viewers INTEGER DEFAULT 0,
  max_voices INTEGER,
  recording_enabled BOOLEAN DEFAULT false,
  recording_status TEXT,                    -- 'recording' | 'paused' | 'completed'
  recording_started_at TIMESTAMPTZ,
  recording_completed_at TIMESTAMPTZ,
  recording_duration_seconds INTEGER,
  recording_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger to sync total_rodas counter
CREATE TRIGGER update_palco_roda_count_trigger
  AFTER INSERT OR DELETE ON public.rodas
  FOR EACH ROW EXECUTE FUNCTION update_palco_roda_count();
```

#### 1.3 `vozes` - Paid Questions Table
```sql
CREATE TABLE public.vozes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roda_id UUID NOT NULL REFERENCES rodas(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  voice_type TEXT NOT NULL,                 -- 'email' | 'live' | 'highlight'
  custom_text TEXT,
  status TEXT DEFAULT 'pending',            -- 'pending' | 'paid' | 'queued' | 'answered' | 'refunded'
  payment_ref TEXT,
  payment_method TEXT,                      -- 'manual' | 'stripe' | etc.
  amount_paid NUMERIC,
  currency TEXT DEFAULT 'USD',
  answered_at TIMESTAMPTZ,
  answer_text TEXT,
  answer_audio_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### 1.4 `palco_voice_types` - Voice Pricing Configuration
```sql
CREATE TABLE public.palco_voice_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  palco_id UUID NOT NULL REFERENCES palcos(id),
  voice_type TEXT NOT NULL,                 -- 'email' | 'live' | 'highlight'
  enabled BOOLEAN DEFAULT true,
  price NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  delivery_description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### 1.5 `roda_participants` - Session Audience
```sql
CREATE TABLE public.roda_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roda_id UUID NOT NULL REFERENCES rodas(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  role TEXT DEFAULT 'viewer',               -- 'viewer' | 'host' | 'moderator'
  joined_at TIMESTAMPTZ DEFAULT now(),
  left_at TIMESTAMPTZ,
  has_paid_qa BOOLEAN DEFAULT false
);
```

#### 1.6 `roda_recordings` - Recording Metadata
```sql
CREATE TABLE public.roda_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roda_id UUID NOT NULL REFERENCES rodas(id),
  palco_id UUID NOT NULL REFERENCES palcos(id),
  initiated_by UUID NOT NULL,
  status TEXT DEFAULT 'recording',          -- 'recording' | 'paused' | 'completed' | 'failed'
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  storage_path TEXT,
  file_size_bytes BIGINT,
  has_transcription BOOLEAN DEFAULT false,
  transcription_text TEXT,
  retention_days INTEGER,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### 1.7 `palco_rentals` - Monetization/Fees
```sql
CREATE TABLE public.palco_rentals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  palco_id UUID NOT NULL REFERENCES palcos(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  model TEXT DEFAULT 'free',                -- 'free' | 'fixed' | 'percentage' | 'per_roda'
  fixed_fee NUMERIC,
  percent_of_sales NUMERIC,
  fee_per_roda NUMERIC,
  payment_status TEXT DEFAULT 'pending',
  payment_ref TEXT,
  invoice_id TEXT,
  paid_at TIMESTAMPTZ,
  currency TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### 1.8 `palco_category_pricing` - Premium Artistic Categories
```sql
CREATE TABLE public.palco_category_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category artistic_category NOT NULL,      -- 'singer' | 'comedian' | 'performer' | 'influencer'
  tier_name TEXT NOT NULL,
  min_price NUMERIC DEFAULT 5,
  max_price NUMERIC DEFAULT 150,
  suggested_email_price NUMERIC DEFAULT 5,
  suggested_live_price NUMERIC DEFAULT 15,
  suggested_highlight_price NUMERIC DEFAULT 30,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Enums
```sql
CREATE TYPE palco_type AS ENUM ('standard', 'premium');
CREATE TYPE artistic_category AS ENUM ('singer', 'comedian', 'performer', 'influencer');
```

### Storage Buckets
- `palco-covers` (public) - Cover images for stages
- `roda-recordings` (private) - Session recordings stored as `{palcoId}/{rodaId}/{recordingId}.webm`

---

## 2. TYPESCRIPT MODELS

```typescript
// src/hooks/usePalco.tsx

export interface Palco {
  id: string;
  guide_id: string;
  title: string;
  theme: string | null;
  description: string | null;
  cover_url: string | null;
  language: string;
  location: string | null;
  tags: string[];
  visibility: 'public' | 'private' | 'unlisted';
  status: 'draft' | 'scheduled' | 'live' | 'ended' | 'archived';
  max_voices_per_roda: number;
  allow_custom_voice_text: boolean;
  allow_ai_assist: boolean;
  min_price: number;
  total_rodas: number;
  total_voices: number;
  featured: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  guide?: {
    id: string;
    display_name: string;
    avatar_url: string | null;
    is_verified: boolean;
  };
  next_roda?: Roda | null;
  voice_types?: VoiceType[];
}

export interface Roda {
  id: string;
  palco_id: string;
  title: string | null;
  scheduled_at: string | null;
  started_at: string | null;
  ended_at: string | null;
  phase: 'scheduled' | 'content' | 'qa' | 'ended';
  qa_start_at: string | null;
  livekit_room_name: string | null;
  viewer_count: number;
  peak_viewers: number;
  created_at: string;
  updated_at: string;
}

export interface VoiceType {
  id: string;
  palco_id: string;
  voice_type: 'email' | 'live' | 'highlight';
  enabled: boolean;
  price: number;
  currency: string;
  delivery_description: string | null;
}

export interface Voz {
  id: string;
  roda_id: string;
  user_id: string;
  voice_type: 'email' | 'live' | 'highlight';
  custom_text: string | null;
  status: 'pending' | 'paid' | 'queued' | 'answered' | 'refunded';
  payment_ref: string | null;
  payment_method: string | null;
  amount_paid: number | null;
  currency: string;
  answered_at: string | null;
  answer_text: string | null;
  answer_audio_url: string | null;
  created_at: string;
  updated_at: string;
}
```

---

## 3. MAIN UI COMPONENTS

### Pages (`src/pages/`)
| File | Purpose |
|------|---------|
| `Palco.tsx` | Discovery page - lists all public palcos with featured card |
| `PalcoDetail.tsx` | Stage detail view with guide info, voice types, and rodas list |
| `CreatePalco.tsx` | Multi-step wizard (4 steps) for creating/editing a palco |
| `GuideDashboard.tsx` | Guide's management dashboard with tabs: Active, Scheduled, Archived |
| `PalcoManage.tsx` | Detailed management of a specific palco (Rodas, Vozes, Stats tabs) |
| `RodaView.tsx` | Live session view for both guides (with controls) and viewers |
| `CheckoutVoice.tsx` | Voice payment checkout page |
| `VoiceDetail.tsx` | Individual voice submission detail |
| `VoicePool.tsx` | Pool of pending voices for a session |

### Components (`src/components/palco/`)
| File | Purpose |
|------|---------|
| `VozesPanel.tsx` | Displays vozes list with status grouping (pending/paid/answered) |
| `GuideProfileSheet.tsx` | Bottom sheet showing guide's full profile |
| `RodaRecordingControls.tsx` | Recording UI with start/pause/stop + upload to storage |

### Live Streaming Components (`src/components/live/`)
| File | Purpose |
|------|---------|
| `VideoTrack.tsx` | Renders LiveKit video track element |
| `AudioTrack.tsx` | Renders LiveKit audio track element |

---

## 4. HOOKS & BUSINESS LOGIC

### Main Hook: `src/hooks/usePalco.tsx`

**Query Hooks:**
- `usePalcos(filters?)` - Fetch all public palcos with optional status/theme/language filters
- `usePalco(palcoId)` - Fetch single palco with guide, voice types, and next roda
- `useMyPalcos()` - Fetch authenticated user's owned palcos
- `useRodas(palcoId)` - Fetch all rodas for a palco
- `useRoda(rodaId)` - Fetch single roda with palco and guide info
- `useVozes(rodaId)` - Fetch all vozes for a roda

**Mutation Hooks:**
- `useCreatePalco()` - Create new palco
- `useUpdatePalco()` - Update existing palco
- `useCreateRoda()` - Create new roda for a palco
- `useStartRoda()` - Start a scheduled roda (sets phase='content', generates LiveKit room name)
- `useStartQA()` - Transition roda to Q&A phase
- `useEndRoda()` - End a live roda (sets phase='ended')
- `useJoinRoda()` - Upsert viewer into roda_participants
- `useSubmitVoz()` - Submit a voice/question (status='pending')
- `useConfirmVozPayment()` - Guide confirms payment (status='paid')
- `useMarkVozAnswered()` - Guide marks voice as answered

### Theme Hook: `src/hooks/useDiscoverTopics.tsx`

**Query Hooks:**
- `useDiscoverTopics()` - Fetch all discover topics with translated names
- `useTrendingTopics(limit)` - Fetch trending topics
- `usePalcoThemes()` - Fetch topics formatted for Palco theme selection

### Streaming Hook: `src/hooks/useRodaStream.tsx`

Manages LiveKit room connection for live sessions:

```typescript
interface UseRodaStreamReturn {
  room: Room | null;
  connectionState: ConnectionState;
  localParticipant: LocalParticipant | null;
  remoteParticipants: RemoteParticipant[];
  isHost: boolean;
  loading: boolean;
  error: string | null;
  
  // Actions
  connectAsHost: (roomName: string) => Promise<boolean>;
  connectAsViewer: (roomName: string) => Promise<boolean>;
  disconnect: () => Promise<void>;
  toggleCamera: () => Promise<void>;
  toggleMicrophone: () => Promise<void>;
  flipCamera: () => Promise<void>;
  
  // State
  isCameraEnabled: boolean;
  isMicrophoneEnabled: boolean;
}
```

---

## 5. EDGE FUNCTIONS

### `supabase/functions/generate-livekit-token/index.ts`

Generates LiveKit JWT tokens for hosts/viewers:

```typescript
interface TokenRequest {
  roomName: string;
  participantName: string;
  participantIdentity: string;
  isHost?: boolean;
}

// Returns:
{
  token: string;
  url: string;          // LIVEKIT_URL
  roomName: string;     // sanitized
  isHost: boolean;
}
```

**Permissions:**
- Hosts: canPublish, canSubscribe, canPublishData, roomCreate
- Viewers: canSubscribe, canPublishData (for chat)

---

## 6. BUSINESS RULES

### Session Lifecycle
```
DRAFT → SCHEDULED → LIVE (content) → Q&A → ENDED
```

1. **Draft**: Palco created without rodas
2. **Scheduled**: Palco has at least one scheduled roda
3. **Live (content)**: Guide has started the roda, broadcasting
4. **Q&A**: Guide transitions to question phase, viewers can submit vozes
5. **Ended**: Session completed, no more interaction

### Voice/Question Flow
```
User submits → PENDING → Guide confirms payment → PAID/QUEUED → Guide answers → ANSWERED
                                           ↘ Issue → REFUNDED
```

### Payment Verification
- Hybrid system: External payment (M-Pesa, bank transfer) + manual confirmation
- Guide manually confirms payment received before voice enters queue
- Status transitions: pending → paid → queued → answered

### Recording
- Captured via MediaRecorder API from LiveKit tracks
- Stored in private `roda-recordings` bucket
- Path: `{palcoId}/{rodaId}/{recordingId}.webm`
- Host controls: Start, Pause, Resume, Stop

### Currency Localization
- Prices stored in USD
- Auto-detected via GPS geolocation on page load
- Converted using `currency_rates` table
- African currencies supported: AOA (Kz), ZAR (R), NGN (₦), etc.

---

## 7. ROUTES

```typescript
// Palco discovery and detail
/palco                          → Palco.tsx (discovery)
/palco/:palcoId                 → PalcoDetail.tsx
/palco/create                   → CreatePalco.tsx
/palco/:palcoId/edit            → CreatePalco.tsx (edit mode)

// Guide dashboard and management
/palco/dashboard                → GuideDashboard.tsx
/palco/:palcoId/manage          → PalcoManage.tsx

// Live session
/palco/:palcoId/roda/:rodaId    → RodaView.tsx

// Voice/checkout
/palco/:palcoId/voice/:voiceTypeId → VoiceDetail.tsx
/palco/checkout                 → CheckoutVoice.tsx
```

---

## 8. SECRETS & ENVIRONMENT

Required Supabase secrets for LiveKit:
- `LIVEKIT_URL`
- `LIVEKIT_API_KEY`
- `LIVEKIT_API_SECRET`

---

## 9. DESIGN TOKENS

Palco uses a premium golden palette defined in `tailwind.config.ts`:

```typescript
palco: {
  accent: '#C9A23F',              // Primary gold
  bg: '#0D0D0D',                  // Dark background
  surface: '#1A1A1A',             // Card surfaces
  border: '#2A2A2A',              // Subtle borders
  text: '#F5F5F5',                // Primary text
  'text-secondary': '#A0A0A0',    // Secondary text
}
```

---

## 10. RELATED MEMORIES

Key architectural decisions documented:
- `architecture/database/palco-schema-and-security`
- `architecture/database/palco-triggers`
- `architecture/live-streaming-integration`
- `features/palco/live-streaming-flow`
- `features/palco/voice-payment-verification`
- `features/palco/recording-architecture`
- `features/palco/currency-localization-system`
- `style/palco-premium-branding`
