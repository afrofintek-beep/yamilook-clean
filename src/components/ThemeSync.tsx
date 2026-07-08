import { useEffect } from 'react';
import { useSettings } from '@/hooks/useSettings';
import { applyTheme, type ThemePref } from '@/lib/theme';

// Applies the user's saved theme (from DB settings) once it loads, so the theme
// is consistent across devices. Boot-time theme comes from localStorage (see the
// inline script in index.html); this reconciles it with the server copy.
export default function ThemeSync() {
  const { settings } = useSettings();
  useEffect(() => {
    if (settings?.theme) applyTheme(settings.theme as ThemePref);
  }, [settings?.theme]);
  return null;
}
