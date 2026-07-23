import { create } from 'zustand';
import { CareMember } from '../types';
import { MOCK_CARE_MEMBERS } from '../services/careCircleService';

interface CareCircleState {
  activeMemberId: string;
  members: CareMember[];
  setActiveMemberId: (id: string) => void;
  setMembers: (members: CareMember[]) => void;
  addMember: (member: CareMember) => void;
}

export const useCareCircleStore = create<CareCircleState>((set) => ({
  activeMemberId: 'pat-101',
  members: MOCK_CARE_MEMBERS,
  setActiveMemberId: (activeMemberId: string) => set({ activeMemberId }),
  setMembers: (members: CareMember[]) => set({ members }),
  addMember: (member: CareMember) =>
    set((state) => ({ members: [...state.members, member] })),
}));
