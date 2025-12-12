import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export const useLanguage = () => {
  const [language, setLanguage] = useState<'en' | 'hi' | 'kn'>('en');
  const { i18n } = useTranslation();

  useEffect(() => {
    const savedLang = localStorage.getItem('language') as 'en' | 'hi' | 'kn' || 'en';
    setLanguage(savedLang);
    i18n.changeLanguage(savedLang);
  }, []);

  return language;
};
