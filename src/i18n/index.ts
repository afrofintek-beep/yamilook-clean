import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Only load Portuguese (default) synchronously, others will be lazy-loaded
import pt from './locales/pt.json';

export const languages = [
  { code: 'am', name: 'Amharic', nativeName: 'አማርኛ' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', rtl: true },
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'kg', name: 'Kikongo', nativeName: 'Kikongo' },
  { code: 'kmb', name: 'Kimbundu', nativeName: 'Kimbundu' },
  { code: 'ln', name: 'Lingala', nativeName: 'Lingála' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português AO' },
  { code: 'pt-banda', name: 'Yamilook da Banda', nativeName: 'Yamilook da Banda' },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili' },
  { code: 'cjk', name: 'Tchokwe', nativeName: 'Tchokwe' },
  { code: 'umb', name: 'Umbundu', nativeName: 'Umbundu' },
];

// Load banda overrides for urban tone
const loadBandaOverrides = async (): Promise<Record<string, unknown>> => {
  const bandaModule = await import('./locales/pt-banda.json');
  return bandaModule.default;
};

// Deep merge helper for translation objects
const deepMerge = (base: Record<string, unknown>, overrides: Record<string, unknown>): Record<string, unknown> => {
  const result = { ...base };
  for (const key of Object.keys(overrides)) {
    if (
      typeof overrides[key] === 'object' &&
      overrides[key] !== null &&
      !Array.isArray(overrides[key]) &&
      typeof result[key] === 'object' &&
      result[key] !== null
    ) {
      result[key] = deepMerge(result[key] as Record<string, unknown>, overrides[key] as Record<string, unknown>);
    } else {
      result[key] = overrides[key];
    }
  }
  return result;
};

// Lazy load language resources
const loadLanguage = async (lng: string): Promise<{ translation: Record<string, unknown> }> => {
  // Handle banda variant
  if (lng === 'pt-banda' || lng === 'pt-BANDA') {
    const bandaOverrides = await loadBandaOverrides();
    return { translation: deepMerge(pt as Record<string, unknown>, bandaOverrides) };
  }

  switch (lng) {
    case 'en':
      return { translation: (await import('./locales/en.json')).default };
    case 'kmb':
      return { translation: (await import('./locales/kmb.json')).default };
    case 'umb':
      return { translation: (await import('./locales/umb.json')).default };
    case 'kg':
      return { translation: (await import('./locales/kg.json')).default };
    case 'cjk':
      return { translation: (await import('./locales/cjk.json')).default };
    case 'fr':
      return { translation: (await import('./locales/fr.json')).default };
    case 'ln':
      return { translation: (await import('./locales/ln.json')).default };
    case 'sw':
      return { translation: (await import('./locales/sw.json')).default };
    case 'am':
      return { translation: (await import('./locales/am.json')).default };
    case 'ar':
      return { translation: (await import('./locales/ar.json')).default };
    default:
      return { translation: pt };
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      pt: { translation: pt },
    },
    fallbackLng: 'pt',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

// Load detected language if it's not Portuguese
const detectedLng = i18n.language;
if (detectedLng && detectedLng !== 'pt') {
  loadLanguage(detectedLng).then((resource) => {
    i18n.addResourceBundle(detectedLng, 'translation', resource.translation);
  });
}

// Hook into language change to lazy load
i18n.on('languageChanged', async (lng) => {
  if (lng !== 'pt' && !i18n.hasResourceBundle(lng, 'translation')) {
    const resource = await loadLanguage(lng);
    i18n.addResourceBundle(lng, 'translation', resource.translation);
  }
});

export default i18n;
