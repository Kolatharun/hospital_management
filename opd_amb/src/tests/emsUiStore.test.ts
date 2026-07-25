import { describe, it, expect, beforeEach } from 'vitest'
import { useEMSUiStore } from '@/features/ems/state/emsUiStore'

describe('Zustand EMS UI Store', () => {
  beforeEach(() => {
    useEMSUiStore.setState({
      activeTab: 'home',
      activeSheet: null,
      offlineSimulated: false,
    })
  })

  it('toggles offline simulated mode correctly', () => {
    expect(useEMSUiStore.getState().offlineSimulated).toBe(false)
    useEMSUiStore.getState().toggleOfflineSimulated()
    expect(useEMSUiStore.getState().offlineSimulated).toBe(true)
  })

  it('updates sheet visibility', () => {
    useEMSUiStore.getState().openSheet('CREW_HELP')
    expect(useEMSUiStore.getState().activeSheet).toBe('CREW_HELP')
    useEMSUiStore.getState().closeSheet()
    expect(useEMSUiStore.getState().activeSheet).toBeNull()
  })
})
