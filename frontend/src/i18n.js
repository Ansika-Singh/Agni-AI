import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './i18n/en.json';
import hi from './i18n/hi.json';
import ta from './i18n/ta.json';
import te from './i18n/te.json';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    hi: { translation: hi },
    ta: { translation: ta },
    te: { translation: te }
  },
  lng: 'en', // default language
  fallbackLng: 'en',
  interpolation: { escapeValue: false }
});

export default i18n;
