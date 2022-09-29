import create from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

import { GraphicsQualitySetting } from "../../engine/renderer/renderer.common";

const SETTINGS_KEY = "thirdroom-settings";
const SETTINGS_STORE_VERSION = 1;

interface SettingsState {
  qualityPromptAtStartup: boolean;
  quality: GraphicsQualitySetting;
}

interface ISettingsStore {
  settings: SettingsState;
  setSetting<K extends keyof SettingsState>(key: K, value: SettingsState[K]): void;
}

const DEFAULT_SETTINGS = {
  qualityPromptAtStartup: true,
  quality: GraphicsQualitySetting.Medium,
};

export const useSettingsStore = create<ISettingsStore>()(
  persist(
    immer((set) => ({
      settings: { ...DEFAULT_SETTINGS },
      setSetting: (key, value) => {
        set((state) => {
          state.settings[key] = value;
        });
      },
    })),
    {
      name: SETTINGS_KEY,
      version: SETTINGS_STORE_VERSION,
      getStorage: () => localStorage,
    }
  )
);
