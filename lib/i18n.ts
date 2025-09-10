import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from '@/locales/en/common.json';
import vi from '@/locales/vi/common.json';

const i18nSetup = i18n.use(initReactI18next);

// only use language detector in browser
if (typeof window !== 'undefined') {
  i18nSetup.use(LanguageDetector);
}

i18nSetup.init({
  debug: process.env.NODE_ENV === 'development',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false, // not needed for react as it escapes by default
  },
  resources: {
    en: {
      translation: en,
    },
    vi: {
      translation: vi,
    },
  },
});

export default i18n;
