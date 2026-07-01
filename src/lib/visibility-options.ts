/**
 * Canonical visibility icons and labels used across the entire app.
 * 
 * Icon mapping (per brand book):
 *   🌍 Todos      — Público / Wis
 *   👥 Kambas     — Amigos
 *   ⭕ Bradas     — Amigos Próximos (círculo interno / Ubuntu)
 *   🔒 Ninguém   — Privado / Só Eu
 *
 * NEVER use hearts, stars or romantic symbols for Bradas.
 */

export type VisibilityLevel = 'everyone' | 'friends' | 'close_friends' | 'nobody';

export interface VisibilityOption {
  value: VisibilityLevel;
  emoji: string;
  label: string;
  description: string;
}

/** Full set of visibility options (4 levels) */
export const VISIBILITY_OPTIONS: VisibilityOption[] = [
  { value: 'everyone',      emoji: '🌍', label: 'Wis',           description: 'Qualquer wis pode ver' },
  { value: 'friends',       emoji: '👥', label: 'Kambas',       description: 'Só os teus kambas' },
  { value: 'close_friends', emoji: '⭕', label: 'Bradas',       description: 'Só os teus bradas' },
  { value: 'nobody',        emoji: '🔒', label: 'Só Eu',        description: 'Só tu podes ver' },
];

/** Subset without close_friends (for features that only support 3 levels) */
export const VISIBILITY_OPTIONS_SIMPLE: VisibilityOption[] = VISIBILITY_OPTIONS.filter(
  (o) => o.value !== 'close_friends'
);

/** Get a single option by value */
export function getVisibilityOption(value: string): VisibilityOption {
  return VISIBILITY_OPTIONS.find((o) => o.value === value) ?? VISIBILITY_OPTIONS[0];
}

/** Render emoji + label for display */
export function visibilityLabel(value: string): string {
  const opt = getVisibilityOption(value);
  return `${opt.emoji} ${opt.label}`;
}
