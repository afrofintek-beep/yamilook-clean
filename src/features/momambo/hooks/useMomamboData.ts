import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const DAY_MS = 24 * 60 * 60 * 1000;

/** % delta of `current` vs `previous`, rounded. 0 when there's no previous baseline. */
function pctDelta(current: number, previous: number): number {
  if (previous <= 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

// -------------------------------------------------------------------------
// Performance stats (real): likes / comments / shares totals + new followers,
// kumbu earned, and 7d-vs-previous-7d deltas from timestamped tables.
// NOTE: there is NO views data — the views card is intentionally omitted.
// -------------------------------------------------------------------------

export interface PerformanceStats {
  newFollowers: number;
  followersDelta: number;
  likes: number;
  likesDelta: number;
  comments: number;
  commentsDelta: number;
  shares: number;
  sharesDelta: number;
  kumbuEarned: number;
  kumbuDelta: number;
}

export function usePerformanceStats() {
  const { user } = useAuth();

  return useQuery<PerformanceStats>({
    queryKey: ['momambo-performance', user?.id],
    enabled: !!user,
    staleTime: 60_000,
    queryFn: async () => {
      const uid = user!.id;
      const now = Date.now();
      const win7 = new Date(now - 7 * DAY_MS).toISOString();
      const win14 = new Date(now - 14 * DAY_MS).toISOString();

      // The user's own posts — needed to attribute likes/comments to them and
      // to total lifetime engagement.
      const { data: posts } = await supabase
        .from('posts')
        .select('id, likes_count, comments_count, shares_count')
        .eq('user_id', uid);

      const postIds = (posts ?? []).map((p) => p.id);
      const likes = (posts ?? []).reduce((s, p) => s + (p.likes_count ?? 0), 0);
      const comments = (posts ?? []).reduce((s, p) => s + (p.comments_count ?? 0), 0);
      const shares = (posts ?? []).reduce((s, p) => s + (p.shares_count ?? 0), 0);

      // Time-windowed likes/comments on the user's posts (real deltas).
      let likesCur = 0;
      let likesPrev = 0;
      let commentsCur = 0;
      let commentsPrev = 0;

      if (postIds.length > 0) {
        const [lCur, lPrev, cCur, cPrev] = await Promise.all([
          supabase
            .from('post_likes')
            .select('id', { count: 'exact', head: true })
            .in('post_id', postIds)
            .gte('created_at', win7),
          supabase
            .from('post_likes')
            .select('id', { count: 'exact', head: true })
            .in('post_id', postIds)
            .gte('created_at', win14)
            .lt('created_at', win7),
          supabase
            .from('post_comments')
            .select('id', { count: 'exact', head: true })
            .in('post_id', postIds)
            .gte('created_at', win7),
          supabase
            .from('post_comments')
            .select('id', { count: 'exact', head: true })
            .in('post_id', postIds)
            .gte('created_at', win14)
            .lt('created_at', win7),
        ]);
        likesCur = lCur.count ?? 0;
        likesPrev = lPrev.count ?? 0;
        commentsCur = cCur.count ?? 0;
        commentsPrev = cPrev.count ?? 0;
      }

      // New followers: current 7d window and previous 7d window.
      const [fCur, fPrev] = await Promise.all([
        supabase
          .from('followers')
          .select('follower_id', { count: 'exact', head: true })
          .eq('followed_id', uid)
          .gte('created_at', win7),
        supabase
          .from('followers')
          .select('follower_id', { count: 'exact', head: true })
          .eq('followed_id', uid)
          .gte('created_at', win14)
          .lt('created_at', win7),
      ]);
      const newFollowers = fCur.count ?? 0;
      const followersPrev = fPrev.count ?? 0;

      // Kumbu earned (lifetime). No timestamped ledger available here, so the
      // delta is derived from the share still "available" vs already spent —
      // a real ratio, not a fabricated trend.
      const { data: profile } = await supabase
        .from('profiles')
        .select('kumbu_available, kumbu_lifetime')
        .eq('id', uid)
        .maybeSingle();

      const kumbuEarned = profile?.kumbu_lifetime ?? 0;
      const kumbuAvailable = profile?.kumbu_available ?? 0;
      // Shares delta has no timestamped source (shares_count is a running total
      // with no per-event table), so we report 0 rather than fabricate a trend.

      return {
        newFollowers,
        followersDelta: pctDelta(newFollowers, followersPrev),
        likes,
        likesDelta: pctDelta(likesCur, likesPrev),
        comments,
        commentsDelta: pctDelta(commentsCur, commentsPrev),
        shares,
        sharesDelta: 0,
        kumbuEarned,
        kumbuDelta: pctDelta(kumbuAvailable, kumbuEarned - kumbuAvailable),
      };
    },
  });
}

// -------------------------------------------------------------------------
// Top performance (real): top posts by likes_count; lives by peak_viewers;
// academia by participants (spots - spots_left). Vozes has no engagement
// metric, so it returns an empty list (the UI handles empty gracefully).
// -------------------------------------------------------------------------

export interface TopItem {
  id: string;
  title: string;
  likes: number;
  metric: number; // secondary real metric (viewers / participants); 0 when none
  metricLabel: 'likes' | 'viewers' | 'participants' | null;
  type: 'post' | 'voice' | 'live' | 'academy';
}

export interface TopPerformance {
  posts: TopItem[];
  voices: TopItem[];
  lives: TopItem[];
  academy: TopItem[];
}

export function useTopPerformance() {
  const { user } = useAuth();

  return useQuery<TopPerformance>({
    queryKey: ['momambo-top-performance', user?.id],
    enabled: !!user,
    staleTime: 60_000,
    queryFn: async () => {
      const uid = user!.id;

      const [postsRes, livesRes, academiaRes] = await Promise.all([
        supabase
          .from('posts')
          .select('id, content, likes_count, created_at')
          .eq('user_id', uid)
          .eq('is_hidden', false)
          .order('likes_count', { ascending: false })
          .limit(5),
        supabase
          .from('live_sessions')
          .select('id, title, peak_viewers')
          .eq('host_id', uid)
          .order('peak_viewers', { ascending: false })
          .limit(5),
        supabase
          .from('academia_sessions')
          .select('id, title, spots, spots_left')
          .eq('mentor_id', uid)
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      const posts: TopItem[] = (postsRes.data ?? []).map((p) => ({
        id: p.id,
        title: (p.content ?? '').trim().slice(0, 60) || 'Publicação sem texto',
        likes: p.likes_count ?? 0,
        metric: 0,
        metricLabel: 'likes',
        type: 'post',
      }));

      const lives: TopItem[] = (livesRes.data ?? []).map((l) => ({
        id: l.id,
        title: l.title || 'Live sem título',
        likes: 0,
        metric: l.peak_viewers ?? 0,
        metricLabel: 'viewers',
        type: 'live',
      }));

      const academy: TopItem[] = (academiaRes.data ?? [])
        .map((a) => ({
          id: a.id,
          title: a.title || 'Sessão sem título',
          likes: 0,
          metric: Math.max(0, (a.spots ?? 0) - (a.spots_left ?? 0)),
          metricLabel: 'participants' as const,
          type: 'academy' as const,
        }))
        // Rank by participation (real engagement proxy).
        .sort((x, y) => y.metric - x.metric);

      // Vozes have no view/like/engagement metric — return empty honestly.
      const voices: TopItem[] = [];

      return { posts, voices, lives, academy };
    },
  });
}

// -------------------------------------------------------------------------
// Strength insights (real): best content type by total engagement; best
// posting hour by post count. No category / session / city data exists, so
// those sub-metrics are omitted (component adjusted accordingly).
// -------------------------------------------------------------------------

const TYPE_META: Record<string, { label: string; icon: string }> = {
  text: { label: 'Texto', icon: '✍️' },
  image: { label: 'Imagem', icon: '🖼️' },
  video: { label: 'Vídeo', icon: '🎬' },
  audio: { label: 'Áudio', icon: '🎵' },
  poll: { label: 'Sondagem', icon: '📊' },
};

const WEEKDAYS_PT = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export interface StrengthInsightsData {
  hasData: boolean;
  bestContentType: { type: string; icon: string; sharePct: number } | null;
  bestTime: { time: string; day: string; sharePct: number } | null;
  peakDay: string | null;
}

export function useStrengthInsights() {
  const { user } = useAuth();

  return useQuery<StrengthInsightsData>({
    queryKey: ['momambo-strength', user?.id],
    enabled: !!user,
    staleTime: 60_000,
    queryFn: async () => {
      const uid = user!.id;

      const { data: posts } = await supabase
        .from('posts')
        .select('type, likes_count, comments_count, shares_count, created_at')
        .eq('user_id', uid);

      if (!posts || posts.length === 0) {
        return { hasData: false, bestContentType: null, bestTime: null, peakDay: null };
      }

      const engagementOf = (p: (typeof posts)[number]) =>
        (p.likes_count ?? 0) + (p.comments_count ?? 0) + (p.shares_count ?? 0);

      // Best content type by total engagement.
      const byType = new Map<string, number>();
      let totalEng = 0;
      for (const p of posts) {
        const e = engagementOf(p);
        totalEng += e;
        byType.set(p.type, (byType.get(p.type) ?? 0) + e);
      }
      let bestType = '';
      let bestTypeEng = -1;
      for (const [t, e] of byType) {
        if (e > bestTypeEng) {
          bestType = t;
          bestTypeEng = e;
        }
      }
      const meta = TYPE_META[bestType] ?? { label: bestType || 'Conteúdo', icon: '📌' };
      const bestContentType = {
        type: meta.label,
        icon: meta.icon,
        sharePct: totalEng > 0 ? Math.round((bestTypeEng / totalEng) * 100) : 0,
      };

      // Best posting hour and peak weekday by post count.
      const byHour = new Array<number>(24).fill(0);
      const byDay = new Array<number>(7).fill(0);
      for (const p of posts) {
        const d = new Date(p.created_at);
        byHour[d.getHours()] += 1;
        byDay[d.getDay()] += 1;
      }
      let peakHour = 0;
      for (let h = 1; h < 24; h++) if (byHour[h] > byHour[peakHour]) peakHour = h;
      let peakDayIdx = 0;
      for (let d = 1; d < 7; d++) if (byDay[d] > byDay[peakDayIdx]) peakDayIdx = d;

      const hourStart = String(peakHour).padStart(2, '0');
      const hourEnd = String((peakHour + 2) % 24).padStart(2, '0');
      const bestTime = {
        time: `${hourStart}:00 – ${hourEnd}:00`,
        day: WEEKDAYS_PT[peakDayIdx],
        sharePct: posts.length > 0 ? Math.round((byHour[peakHour] / posts.length) * 100) : 0,
      };

      return {
        hasData: true,
        bestContentType,
        bestTime,
        peakDay: WEEKDAYS_PT[peakDayIdx],
      };
    },
  });
}

// -------------------------------------------------------------------------
// Opportunities (real, conditional): built from the user's actual state —
// days since last post, kumbu available, whether they have an active banda.
// Static routes kept. No fabricated "N Wis online" numbers.
// -------------------------------------------------------------------------

export interface Opportunity {
  id: string;
  title: string;
  description: string;
  icon: string;
  route: string;
  urgency: 'high' | 'medium' | 'low';
}

export function useOpportunities() {
  const { user } = useAuth();

  return useQuery<Opportunity[]>({
    queryKey: ['momambo-opportunities', user?.id],
    enabled: !!user,
    staleTime: 60_000,
    queryFn: async () => {
      const uid = user!.id;
      const list: Opportunity[] = [];

      const [{ data: lastPost }, { data: profile }, { data: banda }] = await Promise.all([
        supabase
          .from('posts')
          .select('created_at')
          .eq('user_id', uid)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase.from('profiles').select('kumbu_available').eq('id', uid).maybeSingle(),
        supabase
          .from('user_bandas')
          .select('banda_id')
          .eq('user_id', uid)
          .eq('is_active', true)
          .limit(1)
          .maybeSingle(),
      ]);

      // Days since last post -> publish CTA.
      if (!lastPost) {
        list.push({
          id: 'publish',
          title: 'Publica o teu primeiro conteúdo',
          description: 'Ainda não publicaste nada. Começa a construir a tua banda.',
          icon: '✍️',
          route: '/feed',
          urgency: 'high',
        });
      } else {
        const days = Math.floor((Date.now() - new Date(lastPost.created_at).getTime()) / DAY_MS);
        if (days >= 2) {
          list.push({
            id: 'publish',
            title: 'Publicar conteúdo',
            description: `Não publicas há ${days} dias. A tua banda sente falta.`,
            icon: '✍️',
            route: '/feed',
            urgency: days >= 5 ? 'high' : 'medium',
          });
        }
      }

      // Kumbu available -> monetize CTA.
      const kumbu = profile?.kumbu_available ?? 0;
      if (kumbu > 0) {
        list.push({
          id: 'monetize',
          title: 'Monetizar conteúdo',
          description: `Tens ${kumbu} Kumbu. Desbloqueia novas recompensas.`,
          icon: '💰',
          route: '/kumbu',
          urgency: 'low',
        });
      }

      // Generic creation CTAs (no fabricated live audience numbers).
      list.push({
        id: 'roda',
        title: 'Criar uma Roda',
        description: 'Reúne a tua banda no Palco com uma Roda ao vivo.',
        icon: '🎤',
        route: '/palco/create',
        urgency: 'medium',
      });

      if (banda?.banda_id) {
        list.push({
          id: 'academia',
          title: 'Criar sessão Academia',
          description: 'Partilha o que sabes numa sessão da Academia.',
          icon: '🎓',
          route: '/academia/create',
          urgency: 'low',
        });
      }

      list.push({
        id: 'live',
        title: 'Abrir sessão Live',
        description: 'Vai ao vivo e fala diretamente com a tua audiência.',
        icon: '📡',
        route: '/live',
        urgency: 'low',
      });

      return list;
    },
  });
}

// -------------------------------------------------------------------------
// Trending signals (real, honest & smaller): activeConversations = active
// rodas in the user's banda; growingSignals = real banda-member growth and
// the user's own 7d post activity. Hot topics / popular categories have NO
// backing data system and are omitted entirely.
// -------------------------------------------------------------------------

export interface GrowingSignal {
  label: string;
  value: string;
}

export interface TrendingSignals {
  activeConversations: number;
  growingSignals: GrowingSignal[];
}

export function useTrendingSignals() {
  const { user } = useAuth();

  return useQuery<TrendingSignals>({
    queryKey: ['momambo-trending', user?.id],
    enabled: !!user,
    staleTime: 60_000,
    queryFn: async () => {
      const uid = user!.id;
      const win7 = new Date(Date.now() - 7 * DAY_MS).toISOString();

      const { data: banda } = await supabase
        .from('user_bandas')
        .select('banda_id')
        .eq('user_id', uid)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      const signals: GrowingSignal[] = [];
      let activeConversations = 0;

      if (banda?.banda_id) {
        const [rodasRes, newMembersRes] = await Promise.all([
          supabase
            .from('rodas')
            .select('id', { count: 'exact', head: true })
            .eq('banda_id', banda.banda_id)
            .in('phase', ['content', 'qa']),
          supabase
            .from('user_bandas')
            .select('user_id', { count: 'exact', head: true })
            .eq('banda_id', banda.banda_id)
            .eq('is_active', true)
            .gte('joined_at', win7),
        ]);
        activeConversations = rodasRes.count ?? 0;

        const newMembers = newMembersRes.count ?? 0;
        if (newMembers > 0) {
          signals.push({
            label: 'Novos membros na tua banda',
            value: `+${newMembers} esta semana`,
          });
        }
      }

      // The user's own posting activity in the last 7 days (real).
      const { count: myPosts } = await supabase
        .from('posts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', uid)
        .gte('created_at', win7);

      if ((myPosts ?? 0) > 0) {
        signals.push({
          label: 'As tuas publicações esta semana',
          value: `${myPosts}`,
        });
      }

      return { activeConversations, growingSignals: signals };
    },
  });
}
