/**
 * YAMILOOK emoji set — African-first.
 *
 * Grouped emojis for the chat picker. The first group is the official Yamilook
 * cultural reactions; the rest are an African-centred selection (dark skin
 * tones for people/gestures, savanna wildlife, rhythm & culture, Pan-African
 * colours, and African flags with Lusophone Africa first). The final "Outros"
 * group is a general set for everything else.
 */

export interface EmojiGroup {
  key: string;
  label: string;
  emojis: string[];
}

/** Fitzpatrick skin-tone modifiers, from lightest (European) to darkest.
 *  African-first, so the picker defaults to the darkest ('dark'). */
export const SKIN_TONES: { key: string; mod: string; label: string }[] = [
  { key: 'light', mod: '\u{1F3FB}', label: 'Clara' },
  { key: 'medium-light', mod: '\u{1F3FC}', label: 'Média clara' },
  { key: 'medium', mod: '\u{1F3FD}', label: 'Média' },
  { key: 'medium-dark', mod: '\u{1F3FE}', label: 'Média escura' },
  { key: 'dark', mod: '\u{1F3FF}', label: 'Escura' },
];

export const DEFAULT_TONE = '\u{1F3FF}'; // dark

// Emoji_Modifier matches exactly the 5 skin-tone code points.
const TONE_TEST = /\p{Emoji_Modifier}/u;
const TONE_STRIP = /\p{Emoji_Modifier}/gu;

/** Whether an emoji carries a skin tone (i.e. can be re-toned). */
export function supportsTone(emoji: string): boolean {
  return TONE_TEST.test(emoji);
}

/** Re-tone a skin-tone-bearing emoji (person/hand); others are returned as-is.
 *  The modifier goes right after the leading scalar, which is correct for both
 *  simple emojis (👋) and ZWJ sequences (👩‍🦱 → 👩🏿‍🦱). */
export function applyTone(emoji: string, mod: string): string {
  if (!TONE_TEST.test(emoji)) return emoji;
  const arr = Array.from(emoji.replace(TONE_STRIP, ''));
  arr.splice(1, 0, mod);
  return arr.join('');
}

export const EMOJI_GROUPS: EmojiGroup[] = [
  {
    key: 'yamilook',
    label: 'Yamilook',
    // Mirrors AFRICAN_REACTIONS in lib/reactions.ts (cultural — do not replace).
    emojis: ['💛', '🤝🏿', '🪘', '💢', '😒'],
  },
  {
    key: 'gestos',
    label: 'Gestos',
    emojis: [
      '👋🏿', '🙌🏿', '👏🏿', '🙏🏿', '💪🏿', '✊🏿', '👍🏿', '👎🏿',
      '🤝🏿', '🫶🏿', '🤟🏿', '✌🏿', '🤞🏿', '👌🏿', '🤲🏿', '🫰🏿',
      '👊🏿', '🖐🏿', '✋🏿', '🫵🏿', '💅🏿', '🤙🏿', '🤛🏿', '🤜🏿',
      '🖖🏿', '🤏🏿', '👆🏿', '👇🏿', '👈🏿', '👉🏿', '☝🏿', '🤚🏿',
    ],
  },
  {
    key: 'pessoas',
    label: 'Pessoas',
    emojis: [
      '👩🏿', '👨🏿', '🧑🏿', '👶🏿', '👵🏿', '👴🏿', '👸🏿', '🤴🏿',
      '💃🏿', '🕺🏿', '🤰🏿', '🤱🏿', '👩🏿‍🦱', '👨🏿‍🦱', '👩🏿‍🦰', '🧕🏿',
      '👳🏿', '🤵🏿', '👰🏿', '🙋🏿', '🙆🏿', '💁🏿', '🤦🏿', '🤷🏿',
      '🧑🏿‍🍳', '🧑🏿‍🎤', '🧑🏿‍🎨', '🧑🏿‍🏫', '👮🏿', '👷🏿', '🕵🏿', '💂🏿',
      '🏃🏿', '🚶🏿', '🧑🏿‍🦽', '💇🏿', '💆🏿', '🛀🏿', '🧑🏿‍🌾', '🧑🏿‍⚕️',
    ],
  },
  {
    key: 'ritmo',
    label: 'Ritmo',
    emojis: [
      '🪘', '🥁', '🎶', '🎵', '🎤', '🎧', '🎷', '🎸',
      '🪕', '🎺', '🎼', '🪇', '📻', '🔊', '💿', '🎙️',
      '🎹', '🎻', '🪗', '🎬', '🎚️', '🎛️', '📀', '🔈',
    ],
  },
  {
    key: 'natureza',
    label: 'Natureza',
    emojis: [
      '🌍', '🌴', '🌅', '🌞', '⭐', '🔥', '🌺', '🌻',
      '🐘', '🦁', '🦒', '🦓', '🦏', '🦛', '🐆', '🦍',
      '🐊', '🦜', '🐫', '🦩', '🐐', '🐄', '🐒', '🐍',
      '🐅', '🐃', '🦔', '🦚', '🦢', '🐓', '🦇', '🐜',
      '🌵', '🌾', '🌱', '🍃', '🏜️', '🏞️', '⛰️', '🌋',
    ],
  },
  {
    key: 'comida',
    label: 'Comida',
    emojis: [
      '🍠', '🍌', '🥭', '🥥', '🌽', '🫘', '🍲', '🥘',
      '🌶️', '🥜', '🍚', '🐟', '🍉', '🍹', '☕', '🍶',
      '🦐', '🦀', '🍤', '🫓', '🥔', '🍢', '🍛', '🫖',
      '🍺', '🍻', '🥃', '🧉', '🌰', '🥟', '🍧', '🥮',
    ],
  },
  {
    key: 'festa',
    label: 'Festa',
    emojis: [
      '🎉', '🎊', '🥳', '🎈', '🎁', '🎂', '🍾', '🥂',
      '💃🏿', '🕺🏿', '🪩', '🎆', '🎇', '✨', '🎶', '🥁',
      '🏆', '🥇', '👑', '💯', '🙌🏿', '👏🏿', '🔥', '❤️',
    ],
  },
  {
    key: 'simbolos',
    label: 'Símbolos',
    emojis: [
      '✊🏿', '❤️', '🖤', '💚', '💛', '💙', '💜', '🧡',
      '⭐', '☀️', '🔥', '💫', '🌟', '✨', '💯', '👑',
      '☮️', '♻️', '💥', '⚡', '🌈', '🎯', '🗿', '🙏🏿',
    ],
  },
  {
    key: 'bandeiras',
    label: 'Bandeiras',
    // Lusophone Africa first, then the rest of the continent (all 54 nations).
    emojis: [
      '🇦🇴', '🇨🇻', '🇲🇿', '🇬🇼', '🇸🇹', '🇬🇭', '🇳🇬', '🇿🇦',
      '🇰🇪', '🇪🇹', '🇸🇳', '🇨🇩', '🇨🇬', '🇨🇲', '🇨🇮', '🇹🇿',
      '🇺🇬', '🇿🇼', '🇧🇯', '🇧🇫', '🇲🇱', '🇹🇬', '🇷🇼', '🇳🇦',
      '🇧🇼', '🇿🇲', '🇬🇦', '🇬🇳', '🇲🇬', '🇲🇼', '🇩🇿', '🇪🇬',
      '🇲🇦', '🇹🇳', '🇱🇾', '🇸🇩', '🇸🇸', '🇪🇷', '🇩🇯', '🇸🇴',
      '🇧🇮', '🇹🇩', '🇨🇫', '🇬🇶', '🇱🇷', '🇸🇱', '🇬🇲', '🇲🇷',
      '🇳🇪', '🇱🇸', '🇸🇿', '🇰🇲', '🇸🇨', '🇲🇺',
    ],
  },
  {
    key: 'outros',
    label: 'Outros',
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣',
      '🙂', '😉', '😊', '😍', '🥰', '😘', '😎', '🤩',
      '🤔', '😐', '😴', '😭', '😢', '😤', '😡', '🥳',
      '😇', '🤗', '🤫', '🤭', '😌', '😔', '🙄', '😬',
      '👍', '👎', '🙏', '👏', '🙌', '💪', '🤝', '🫶',
      '❤️', '🔥', '🎉', '✅', '❌', '⭐', '💡', '🎁',
    ],
  },
];
