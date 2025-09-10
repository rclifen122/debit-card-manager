"use client";

import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      <button
        onClick={() => changeLanguage('en')}
        disabled={i18n.language.startsWith('en')}
        className="disabled:opacity-50 disabled:cursor-not-allowed p-1 rounded-md hover:bg-gray-100"
      >
        EN
      </button>
      <span className="text-gray-300">|</span>
      <button
        onClick={() => changeLanguage('vi')}
        disabled={i18n.language.startsWith('vi')}
        className="disabled:opacity-50 disabled:cursor-not-allowed p-1 rounded-md hover:bg-gray-100"
      >
        VI
      </button>
    </div>
  );
}
