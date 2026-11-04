import { useState } from 'react';
import { Sun, Moon, Smartphone, Check, Lock } from 'lucide-react';
import { THEME_COLORS } from '@/lib/appSettings';
import type { AppSettings, ThemeColor, ThemeMode, Wallpaper } from '@/lib/appSettings';
import { SettingsPage, SettingsSection } from '@/components/settings/SettingsUi';
import { WallpaperEditor } from '@/components/settings/WallpaperEditor';

interface AppearancePageProps {
  themeMode: ThemeMode;
  themeColor: ThemeColor;
  onChange: (patch: Partial<AppSettings>) => void;
  wallpaper: Wallpaper | null;
  onSaveWallpaper: (wallpaper: Wallpaper | null) => boolean;
  canUsePremium: boolean;
  onUpgrade: () => void;
  onBack: () => void;
}

const MODES: { id: ThemeMode; label: string; icon: typeof Sun }[] = [
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'system', label: 'System', icon: Smartphone },
];

export function AppearancePage({
  themeMode,
  themeColor,
  onChange,
  wallpaper,
  onSaveWallpaper,
  canUsePremium,
  onUpgrade,
  onBack,
}: AppearancePageProps) {
  const [showWallpaper, setShowWallpaper] = useState(false);

  return (
    <SettingsPage title="Appearance" onBack={onBack}>
      <SettingsSection title="Theme">
        <div className="grid grid-cols-3 gap-2">
          {MODES.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onChange({ themeMode: id })}
              className={`flex flex-col items-center gap-1.5 py-3 rounded-xl text-xs font-semibold transition-colors ${
                themeMode === id ? 'bg-[#075E54] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </button>
          ))}
        </div>
      </SettingsSection>

      <SettingsSection title="Color">
        <div className="flex items-center justify-between">
          {THEME_COLORS.map((c) => (
            <button
              key={c.id}
              onClick={() => (canUsePremium || c.id === 'teal' ? onChange({ themeColor: c.id }) : onUpgrade())}
              aria-label={c.label}
              className="relative w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-110"
              style={{ backgroundColor: c.swatch }}
            >
              {themeColor === c.id && <Check className="w-5 h-5 text-white" />}
              {!canUsePremium && c.id !== 'teal' && (
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-white flex items-center justify-center shadow">
                  <Lock className="w-2.5 h-2.5 text-[#075E54]" />
                </span>
              )}
            </button>
          ))}
        </div>
      </SettingsSection>

      <SettingsSection title="Chat wallpaper">
        {!canUsePremium ? (
          <button
            onClick={onUpgrade}
            className="w-full py-3 rounded-xl bg-gray-100 text-gray-800 text-sm font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4 text-[#075E54]" />
            Unlock wallpapers with Premium
          </button>
        ) : showWallpaper ? (
          <WallpaperEditor
            wallpaper={wallpaper}
            onSave={(next) => {
              const saved = onSaveWallpaper(next);
              if (saved) setShowWallpaper(false);
              return saved;
            }}
            onCancel={() => setShowWallpaper(false)}
          />
        ) : (
          <button
            onClick={() => setShowWallpaper(true)}
            className="w-full py-3 rounded-xl bg-gray-100 text-gray-800 text-sm font-semibold hover:bg-gray-200 transition-colors"
          >
            {wallpaper ? 'Edit wallpaper' : 'Upload wallpaper'}
          </button>
        )}
      </SettingsSection>
    </SettingsPage>
  );
}
