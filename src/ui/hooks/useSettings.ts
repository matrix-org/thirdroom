import { useCallback, useState } from "react";

const SETTINGS_KEY = "thirdroom-settings";

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
  promptAtStartup: boolean;
  quality: GraphicsQualitySetting;
}

const DEFAULT_SETTINGS = {
  promptAtStartup: true,
  quality: GraphicsQualitySetting.Medium,
};

export function useSettings() {
  const [settings, setSettings] = useState<SettingsState>(() => {
    const initSettings = window.localStorage.getItem(SETTINGS_KEY);

    let settingsObj: SettingsState | undefined;

    if (initSettings) {
      try {
        settingsObj = JSON.parse(initSettings);
      } catch {}
    }

    if (!settingsObj) {
      try {
        window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
      } catch {}
    }

    return settingsObj || DEFAULT_SETTINGS;
  });

  const onSetSetting = useCallback(
    <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
      const newSettings = { ...settings, promptAtStartup: false, [key]: value };

      try {
        window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
      } catch {}

      setSettings(newSettings);
    },
    [settings]
  );

  return [settings, onSetSetting];
}
