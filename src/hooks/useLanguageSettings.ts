import { useCallback, useEffect, useState } from 'react';

const SETTINGS_KEY = 'lt_lang_settings';

export interface LangSettings {
  myLang: string;
  targetLang: string;
}

function load(): LangSettings | null {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LangSettings;
    if (!parsed.myLang || !parsed.targetLang) return null;
    return parsed;
  } catch {
    return null;
  }
}

function save(settings: LangSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

export function useLanguageSettings() {
  const [settings, setSettings] = useState<LangSettings | null>(() => load());

  useEffect(() => {
    if (settings) save(settings);
  }, [settings]);

  const saveSettings = useCallback((myLang: string, targetLang: string) => {
    setSettings({ myLang, targetLang });
  }, []);

  return {
    settings,
    isOnboarded: !!settings,
    saveSettings,
  };
}
