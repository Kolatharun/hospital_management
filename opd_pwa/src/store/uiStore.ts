import { create } from 'zustand';
import { safeStorage } from '../utils/storage';

type AppLanguage = 'en' | 'hi' | 'mr';

interface UIStoreState {
  language: AppLanguage;
  pwaInstallPromptDismissed: boolean;
  activeBottomSheet: string | null;
  setLanguage: (lang: AppLanguage) => void;
  setBottomSheet: (sheetId: string | null) => void;
  dismissInstallPrompt: () => void;
}

export const useUIStore = create<UIStoreState>((set) => ({
  language: (safeStorage.getItem('bhc_language') as AppLanguage) || 'en',
  pwaInstallPromptDismissed: safeStorage.getItem('bhc_pwa_dismissed') === 'true',
  activeBottomSheet: null,

  setLanguage: (language: AppLanguage) => {
    safeStorage.setItem('bhc_language', language);
    set({ language });
  },

  setBottomSheet: (sheetId: string | null) => set({ activeBottomSheet: sheetId }),

  dismissInstallPrompt: () => {
    safeStorage.setItem('bhc_pwa_dismissed', 'true');
    set({ pwaInstallPromptDismissed: true });
  },
}));
