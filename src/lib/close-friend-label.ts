import i18n from '@/i18n';

/**
 * Returns the gender-aware singular label for a close friend.
 * 
 * Usage:
 *   getCloseFriendLabel('female') → "Sis" (pt-banda) / "Amiga próxima" (pt)
 *   getCloseFriendLabel('male')   → "Brada" (pt-banda) / "Amigo próximo" (pt)
 *   getCloseFriendLabel(null)     → defaults to male/neutral
 * 
 * For GROUP references (tabs, filters, counts, privacy labels),
 * always use t('social.closeFriendsGroup') directly.
 */
export function getCloseFriendLabel(
  gender?: 'male' | 'female' | 'other' | null
): string {
  if (gender === 'female') {
    return i18n.t('social.closeFriendFemale');
  }
  return i18n.t('social.closeFriendMale');
}
