import type { CSSProperties } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ThemeColor = 'teal' | 'blue' | 'purple' | 'black' | 'green';

export interface Profile {
  name: string;
  status: string;
  avatar: string | null;
  countryCode: string;
  phone: string;
}

export interface AppSettings {
  profile: Profile;
  themeMode: ThemeMode;
  themeColor: ThemeColor;
  notifications: { sound: boolean; vibrate: boolean };
  calls: { autoTranslate: boolean };
}

export interface Wallpaper {
  dataUrl: string;
  opacity: number;
  blur: boolean;
}

export const THEME_COLORS: { id: ThemeColor; label: string; swatch: string }[] = [
  { id: 'teal', label: 'Teal', swatch: '#075E54' },
  { id: 'blue', label: 'Blue', swatch: '#0D47A1' },
  { id: 'purple', label: 'Purple', swatch: '#4A148C' },
  { id: 'black', label: 'Black', swatch: '#111B21' },
  { id: 'green', label: 'Green', swatch: '#1B5E20' },
];

export const DEFAULT_APP_SETTINGS: AppSettings = {
  profile: { name: 'You', status: 'Hey there! I am using Live Translation', avatar: null, countryCode: 'MG', phone: '' },
  themeMode: 'light',
  themeColor: 'teal',
  notifications: { sound: true, vibrate: true },
  calls: { autoTranslate: false },
};

const SETTINGS_KEY = 'lt_app_settings';
const WALLPAPER_KEY = 'chatWallpaper';

export function loadAppSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_APP_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      ...DEFAULT_APP_SETTINGS,
      ...parsed,
      profile: { ...DEFAULT_APP_SETTINGS.profile, ...parsed.profile },
      notifications: { ...DEFAULT_APP_SETTINGS.notifications, ...parsed.notifications },
      calls: { ...DEFAULT_APP_SETTINGS.calls, ...parsed.calls },
    };
  } catch {
    return DEFAULT_APP_SETTINGS;
  }
}

export function saveAppSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

export function loadWallpaper(): Wallpaper | null {
  try {
    const raw = localStorage.getItem(WALLPAPER_KEY);
    return raw ? (JSON.parse(raw) as Wallpaper) : null;
  } catch {
    return null;
  }
}

export function saveWallpaper(wallpaper: Wallpaper | null): boolean {
  try {
    if (wallpaper) localStorage.setItem(WALLPAPER_KEY, JSON.stringify(wallpaper));
    else localStorage.removeItem(WALLPAPER_KEY);
    return true;
  } catch {
    return false;
  }
}

export function wallpaperLayerStyle(wallpaper: Wallpaper): CSSProperties {
  return {
    backgroundImage: `url("${wallpaper.dataUrl}")`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    opacity: wallpaper.opacity / 100,
    filter: wallpaper.blur ? 'blur(6px)' : undefined,
    transform: wallpaper.blur ? 'scale(1.05)' : undefined,
  };
}

export function applyTheme(mode: ThemeMode, color: ThemeColor): void {
  const root = document.documentElement;
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  root.classList.toggle('dark', mode === 'dark' || (mode === 'system' && systemDark));
  root.dataset.color = color;
}
