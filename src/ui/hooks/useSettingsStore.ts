import create from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

const SETTINGS_KEY = "thirdroom-settings";
const SETTINGS_STORE_VERSION = 0;

export enum GraphicsQualitySetting {
  Low = "low",
  Medium = "medium",
  High = "high",
}

export interface GraphicsQualityOption {
  label: string;
  value: string;
}

export const GraphicsQualityOptions: GraphicsQualityOption[] = [
  {
    label: "Low",
    value: GraphicsQualitySetting.Low,
  },
  {
    label: "Medium",
    value: GraphicsQualitySetting.Medium,
  },
  {
    label: "High",
    value: GraphicsQualitySetting.High,
  },
];

interface SettingsState {
  qualityPromptAtStartup: boolean;
  quality: GraphicsQualitySetting;
}

const DEFAULT_SETTINGS = {
  qualityPromptAtStartup: true,
  quality: GraphicsQualitySetting.Medium,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    immer((set) => ({
      ...DEFAULT_SETTINGS,
      setSetting: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
        set((state) => {
          state[key] = value;
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
