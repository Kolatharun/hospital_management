import { create } from 'zustand'

export type SheetType = 'CREW_HELP' | 'UNABLE_TO_RESPOND' | 'ADD_VITALS' | 'ADD_CARE_EVENT' | 'CONFIRM_DISTRESS' | null
export type DialogType = 'CONFIRM_CANCEL' | 'SEARCH_HOSPITAL' | 'MISSION_DETAILS' | null

interface EMSUiState {
  activeTab: 'home' | 'missions' | 'records' | 'profile'
  activeCareStep: 'TRIAGE' | 'VITALS' | 'CARE_LOG' | 'SUMMARY'
  activeSheet: SheetType
  activeDialog: DialogType
  theme: 'dark' | 'light'
  reducedMotion: boolean
  offlineSimulated: boolean
  
  setActiveTab: (tab: 'home' | 'missions' | 'records' | 'profile') => void
  setActiveCareStep: (step: 'TRIAGE' | 'VITALS' | 'CARE_LOG' | 'SUMMARY') => void
  openSheet: (sheet: SheetType) => void
  closeSheet: () => void
  openDialog: (dialog: DialogType) => void
  closeDialog: () => void
  setTheme: (theme: 'dark' | 'light') => void
  toggleOfflineSimulated: () => void
}

export const useEMSUiStore = create<EMSUiState>((set) => ({
  activeTab: 'home',
  activeCareStep: 'TRIAGE',
  activeSheet: null,
  activeDialog: null,
  theme: 'dark',
  reducedMotion: false,
  offlineSimulated: false,

  setActiveTab: (tab) => set({ activeTab: tab }),
  setActiveCareStep: (step) => set({ activeCareStep: step }),
  openSheet: (sheet) => set({ activeSheet: sheet }),
  closeSheet: () => set({ activeSheet: null }),
  openDialog: (dialog) => set({ activeDialog: dialog }),
  closeDialog: () => set({ activeDialog: null }),
  setTheme: (theme) => set({ theme }),
  toggleOfflineSimulated: () => set((state) => ({ offlineSimulated: !state.offlineSimulated })),
}))
