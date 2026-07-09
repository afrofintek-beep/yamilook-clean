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
      '👊🏿', '🖐🏿', '✋🏿', '🫵🏿', '💅🏿', '🤙🏿',
    ],
  },
  {
    key: 'pessoas',
    label: 'Pessoas',
    emojis: [
      '👩🏿', '👨🏿', '🧑🏿', '👶🏿', '👵🏿', '👴🏿', '👸🏿', '🤴🏿',
      '💃🏿', '🕺🏿', '🤰🏿', '🤱🏿', '👩🏿‍🦱', '👨🏿‍🦱', '👩🏿‍🦰', '🧕🏿',
      '👳🏿', '🤵🏿', '👰🏿', '🙋🏿', '🙆🏿', '💁🏿', '🤦🏿', '🤷🏿',
    ],
  },
  {
    key: 'ritmo',
    label: 'Ritmo',
    emojis: [
      '🪘', '🥁', '🎶', '🎵', '🎤', '🎧', '🎷', '🎸',
      '🪕', '🎺', '🎼', '🪇', '📻', '🔊', '💿', '🎙️',
    ],
  },
  {
    key: 'natureza',
    label: 'Natureza',
    emojis: [
      '🌍', '🌴', '🌅', '🌞', '⭐', '🔥', '🌺', '🌻',
      '🐘', '🦁', '🦒', '🦓', '🦏', '🦛', '🐆', '🦍',
      '🐊', '🦜', '🐫', '🦩', '🐐', '🐄', '🐒', '🐍',
    ],
  },
  {
    key: 'comida',
    label: 'Comida',
    emojis: [
      '🍠', '🍌', '🥭', '🥥', '🌽', '🫘', '🍲', '🥘',
      '🌶️', '🥜', '🍚', '🐟', '🍉', '🍹', '☕', '🍶',
    ],
  },
  {
    key: 'simbolos',
    label: 'Símbolos',
    emojis: [
      '✊🏿', '❤️', '🖤', '💚', '💛', '💙', '💜', '🧡',
      '⭐', '☀️', '🔥', '💫', '🌟', '✨', '💯', '👑',
    ],
  },
  {
    key: 'bandeiras',
    label: 'Bandeiras',
    // Lusophone Africa first, then the rest of the continent.
    emojis: [
      '🇦🇴', '🇨🇻', '🇲🇿', '🇬🇼', '🇸🇹', '🇬🇭', '🇳🇬', '🇿🇦',
      '🇰🇪', '🇪🇹', '🇸🇳', '🇨🇩', '🇨🇬', '🇨🇲', '🇨🇮', '🇹🇿',
      '🇺🇬', '🇿🇼', '🇧🇯', '🇧🇫', '🇲🇱', '🇹🇬', '🇷🇼', '🇳🇦',
      '🇧🇼', '🇿🇲', '🇬🇦', '🇬🇳', '🇲🇬', '🇲🇼',
    ],
  },
  {
    key: 'outros',
    label: 'Outros',
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣',
      '🙂', '😉', '😊', '😍', '🥰', '😘', '😎', '🤩',
      '🤔', '😐', '😴', '😭', '😢', '😤', '😡', '🥳',
      '👍', '👎', '🙏', '👏', '🙌', '💪', '🤝', '🫶',
      '❤️', '🔥', '🎉', '✅', '❌', '⭐', '💡', '🎁',
    ],
  },
];
