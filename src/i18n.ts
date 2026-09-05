import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en, { type Resources } from './locales/en';
import es from './locales/es';
import ta from './locales/ta';

export const defaultNS = 'translation' as const;

export const resources = {
  en: { translation: en },
  es: { translation: es },
  ta: { translation: ta },
} as const;

i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  defaultNS,
  interpolation: { escapeValue: false },
});

// Tell react-i18next about the shape of our resources so that `t()` calls
// get full key autocomplete (e.g. `t('home.goContact')`) and type-checking.
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: typeof defaultNS;
    resources: Resources;
  }
}

export default i18n;
