/** Kumbu economy – copy & constants (algorithm thresholds only, no formula). */

export const LEVEL_THRESHOLDS = [
  { level: 'Bronze', min: 0, max: 200 },
  { level: 'Prata', min: 200, max: 800 },
  { level: 'Ouro', min: 800, max: 2000 },
  { level: 'KOTA', min: 2000, max: Infinity },
] as const;

export type KumbuLevel = (typeof LEVEL_THRESHOLDS)[number]['level'];

export function levelFor(lifetime: number): KumbuLevel {
  return (LEVEL_THRESHOLDS.find((t) => lifetime < t.max) ?? LEVEL_THRESHOLDS[3]).level;
}

export function levelProgress(lifetime: number) {
  const tier = LEVEL_THRESHOLDS.find((t) => lifetime < t.max) ?? LEVEL_THRESHOLDS[3];
  if (tier.max === Infinity) return { pct: 100, current: lifetime, target: tier.min };
  const range = tier.max - tier.min;
  const progress = lifetime - tier.min;
  return { pct: Math.min(100, Math.round((progress / range) * 100)), current: lifetime, target: tier.max };
}

/** Friendly labels for reason codes coming from kumbu_ledger.action_type */
export const ACTION_LABELS: Record<string, string> = {
  roda_join: 'Participar na Roda',
  roda_create: 'Criar Roda',
  academia_session: 'Sessão na Academia',
  referral: 'Convidar utilizador activo',
  post_create: 'Publicação criada',
  weekly_bonus: 'Bónus semanal Top 10',
  spend: 'Utilização de Kumbu',
  payout: 'Conversão para dinheiro',
  admin_grant: 'Bónus administrativo',
};

export const EARN_ACTIONS = [
  { action: 'Participar na Roda', kumbu: '+5', limit: 'máx. 3/dia' },
  { action: 'Criar Roda', kumbu: '+8', limit: 'máx. 2/dia' },
  { action: 'Sessão na Academia', kumbu: '+15', limit: 'máx. 1/dia' },
  { action: 'Convidar utilizador activo', kumbu: '+15', limit: 'máx. 5/mês' },
  { action: 'Publicar no feed', kumbu: '+3', limit: 'máx. 3/dia' },
];

export const WEEKLY_REWARDS = [
  { position: '#1', kumbu: '+40' },
  { position: '#2–3', kumbu: '+25' },
  { position: '#4–10', kumbu: '+10' },
];

export const DAILY_CAP = 40;

export const TAGLINE = 'Na Yamilook, quem participa ganha Kumbu.';
export const TAGLINE_ACADEMIA = 'Usa o teu Kumbu na Academia da Banda.';
export const TAGLINE_FULL =
  'Mokubico é convivência. Academia é crescimento. Kumbu é valor.';
export const ECONOMY_LABEL = 'Economia da Participação';
