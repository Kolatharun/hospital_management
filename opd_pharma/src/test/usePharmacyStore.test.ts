import { describe, it, expect } from 'vitest';
import { usePharmacyStore } from '../store/usePharmacyStore';

describe('usePharmacyStore Zustand Store Tests', () => {
  it('toggles sidebar state', () => {
    const initial = usePharmacyStore.getState().isSidebarCollapsed;
    usePharmacyStore.getState().toggleSidebar();
    expect(usePharmacyStore.getState().isSidebarCollapsed).toBe(!initial);
  });

  it('updates global search query', () => {
    usePharmacyStore.getState().setSearchQuery('Rajesh');
    expect(usePharmacyStore.getState().searchQuery).toBe('Rajesh');
  });

  it('clears notification count', () => {
    usePharmacyStore.getState().clearNotifications();
    expect(usePharmacyStore.getState().notificationCount).toBe(0);
  });
});
