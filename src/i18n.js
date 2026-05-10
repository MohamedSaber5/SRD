import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import translationAR from './locales/ar.json';
import translationEN from './locales/en.json';

const resources = {
  en: {
    translation: translationEN
  },
  ar: {
    translation: translationAR
  }
};

const savedLanguage = localStorage.getItem('userLanguage') || 'ar';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage,
    fallbackLng: 'ar',
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18n;
