import { useCallback, useEffect, useState } from 'react';
import {
  applyTheme,
  loadAppSettings,
  loadWallpaper,
  saveAppSettings,
  saveWallpaper,
} from '@/lib/appSettings';
import type { AppSettings, Profile, ThemeColor, Wallpaper } from '@/lib/appSettings';

export function useAppSettings(canUsePremium: boolean) {
  const [settings, setSettings] = useState<AppSettings>(() => loadAppSettings());
  const [wallpaper, setWallpaper] = useState<Wallpaper | null>(() => loadWallpaper());
  const effectiveColor: ThemeColor = canUsePremium ? settings.themeColor : 'teal';

  useEffect(() => {
    saveAppSettings(settings);
  }, [settings]);

  useEffect(() => {
    applyTheme(settings.themeMode, effectiveColor);
  }, [settings.themeMode, effectiveColor]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      if (settings.themeMode === 'system') applyTheme(settings.themeMode, effectiveColor);
    };
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [settings.themeMode, effectiveColor]);

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const updateProfile = useCallback((patch: Partial<Profile>) => {
    setSettings((prev) => ({ ...prev, profile: { ...prev.profile, ...patch } }));
  }, []);

  const updateWallpaper = useCallback((next: Wallpaper | null): boolean => {
    const saved = saveWallpaper(next);
    if (saved) setWallpaper(next);
    return saved;
  }, []);

  return { settings, updateSettings, updateProfile, wallpaper, updateWallpaper };
}
