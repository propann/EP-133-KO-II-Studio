export type AppLanguage = 'fr' | 'en' | 'es';

export const APP_LANGUAGE_KEY = 'ep133-ko-ii-studio:language:v1';

export function loadAppLanguage(): AppLanguage {
  const saved = localStorage.getItem(APP_LANGUAGE_KEY);
  return saved === 'en' || saved === 'es' ? saved : 'fr';
}
