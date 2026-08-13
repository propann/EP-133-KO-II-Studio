import { create } from 'zustand';
import { APP_LANGUAGE_KEY, loadAppLanguage, type AppLanguage } from '../i18n';

interface LanguageStore {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
}

/**
 * Premier domaine d'état sorti d'`App.tsx` vers un magasin zustand partagé
 * (Roadmap Phase 1, priorité n°1 « Découper App.tsx », docs/REGISTRE_IDEES.md
 * R-08). Choisi comme pilote parce qu'il est déjà isolé : persistance dans le
 * même `localStorage` qu'avant (même clé, même format, aucune migration de
 * données), et consommé par plusieurs pages sans dépendre du reste de l'état
 * du Studio. Voir etude/02_BIBLIOTHEQUES_TECHNIQUES.md.
 */
export const useLanguageStore = create<LanguageStore>((set) => ({
  language: loadAppLanguage(),
  setLanguage: (language) => {
    localStorage.setItem(APP_LANGUAGE_KEY, language);
    document.documentElement.lang = language;
    set({ language });
  },
}));
