import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsState {
  targetRecipient: string;
  setTargetRecipient: (target: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      targetRecipient: 'Prueba',
      setTargetRecipient: (target) => set({ targetRecipient: target }),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
