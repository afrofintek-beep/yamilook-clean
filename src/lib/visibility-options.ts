import i18n from '@/i18n';

/**
 * Canonical visibility icons and labels used across the entire app.
 *
 * Icon mapping (per brand book):
 *   🌍 everyone      — Todos (pt) / Wis (banda)
 *   👥 friends       — Amigos (pt) / Kambas (banda)
 *   ⭕ close_friends — Amigos próximos (pt) / Bradas (banda, círculo interno / Ubuntu)
 *   🔒 nobody        — Só eu
 *
 * Labels live in i18n (namespace `visibility`) so the urban "banda" language
 * and the other locales render their own terms. Render with t(opt.labelKey).
 * NEVER use hearts, stars or romantic symbols for Bradas.
 */

export type VisibilityLevel = 'everyone' | 'friends' | 'close_friends' | 'nobody';

export interface VisibilityOption {
  value: VisibilityLevel;
  emoji: string;
  labelKey: string;
  descriptionKey: string;
}

/** Full set of visibility options (4 levels) */
export const VISIBILITY_OPTIONS: VisibilityOption[] = [
  { value: 'everyone',      emoji: '🌍', labelKey: 'visibility.everyone',     descriptionKey: 'visibility.everyoneDesc' },
  { value: 'friends',       emoji: '👥', labelKey: 'visibility.friends',      descriptionKey: 'visibility.friendsDesc' },
  { value: 'close_friends', emoji: '⭕', labelKey: 'visibility.closeFriends', descriptionKey: 'visibility.closeFriendsDesc' },
  { value: 'nobody',        emoji: '🔒', labelKey: 'visibility.nobody',       descriptionKey: 'visibility.nobodyDesc' },
];

/** Subset without close_friends (for features that only support 3 levels) */
export const VISIBILITY_OPTIONS_SIMPLE: VisibilityOption[] = VISIBILITY_OPTIONS.filter(
  (o) => o.value !== 'close_friends'
);

/** Get a single option by value */
export function getVisibilityOption(value: string): VisibilityOption {
  return VISIBILITY_OPTIONS.find((o) => o.value === value) ?? VISIBILITY_OPTIONS[0];
}

/** Render emoji + label for display (translated to the active language) */
export function visibilityLabel(value: string): string {
  const opt = getVisibilityOption(value);
  return `${opt.emoji} ${i18n.t(opt.labelKey)}`;
}
