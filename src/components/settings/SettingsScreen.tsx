import { useState } from 'react';
import { User, Palette, Languages, Lock, Bell, Phone, HardDrive, Info, X, Crown } from 'lucide-react';
import type { AppSettings, Profile, Wallpaper } from '@/lib/appSettings';
import { SettingsRow, SettingsSection } from '@/components/settings/SettingsUi';
import { ProfilePage } from '@/components/settings/ProfilePage';
import { AppearancePage } from '@/components/settings/AppearancePage';
import { PrivacyPage, NotificationsPage, CallsPage } from '@/components/settings/PrivacyPage';
import { StoragePage, AboutPage } from '@/components/settings/DataPages';

type SettingsPageId = 'menu' | 'profile' | 'appearance' | 'privacy' | 'notifications' | 'calls' | 'storage' | 'about';

const THEME_LABELS: Record<AppSettings['themeMode'], string> = {
  light: 'Light',
  dark: 'Dark',
  system: 'System',
};

interface SettingsScreenProps {
  onClose: () => void;
  onEditLanguages: () => void;
  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => void;
  updateProfile: (patch: Partial<Profile>) => void;
  wallpaper: Wallpaper | null;
  updateWallpaper: (wallpaper: Wallpaper | null) => boolean;
  blocked: string[];
  unblockNumber: (phone: string) => void;
  premiumLabel: string;
  canUsePremium: boolean;
  onOpenPaywall: () => void;
}

export function SettingsScreen({
  onClose,
  onEditLanguages,
  settings,
  updateSettings,
  updateProfile,
  wallpaper,
  updateWallpaper,
  blocked,
  unblockNumber,
  premiumLabel,
  canUsePremium,
  onOpenPaywall,
}: SettingsScreenProps) {
  const [page, setPage] = useState<SettingsPageId>('menu');
  const back = () => setPage('menu');

  switch (page) {
    case 'profile':
      return <ProfilePage profile={settings.profile} onSave={updateProfile} onBack={back} />;
    case 'appearance':
      return (
        <AppearancePage
          themeMode={settings.themeMode}
          themeColor={settings.themeColor}
          onChange={updateSettings}
          wallpaper={wallpaper}
          onSaveWallpaper={updateWallpaper}
          canUsePremium={canUsePremium}
          onUpgrade={onOpenPaywall}
          onBack={back}
        />
      );
    case 'privacy':
      return <PrivacyPage blocked={blocked} onUnblock={unblockNumber} onBack={back} />;
    case 'notifications':
      return <NotificationsPage settings={settings} onChange={updateSettings} onBack={back} />;
    case 'calls':
      return <CallsPage settings={settings} onChange={updateSettings} onBack={back} />;
    case 'storage':
      return <StoragePage onBack={back} />;
    case 'about':
      return <AboutPage onBack={back} />;
    case 'menu':
      break;
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#F0F2F5] max-w-md mx-auto">
      <div className="flex-shrink-0 bg-[#075E54] px-3 py-3 flex items-center gap-3 shadow-md">
        <button
          onClick={onClose}
          aria-label="Close settings"
          className="text-white p-1 hover:bg-white/10 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-white font-bold text-lg">Settings</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <button
          onClick={() => setPage('profile')}
          className="w-full bg-white rounded-2xl shadow-sm p-4 flex items-center gap-4 text-left hover:bg-gray-50 transition-colors"
        >
          <div className="w-16 h-16 rounded-full overflow-hidden bg-[#075E54] flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
            {settings.profile.avatar ? (
              <img src={settings.profile.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              settings.profile.name.trim().charAt(0).toUpperCase() || '?'
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 truncate">{settings.profile.name}</p>
            <p className="text-sm text-gray-500 truncate">{settings.profile.status}</p>
          </div>
        </button>

        <SettingsSection title="Premium">
          <div className="-mx-4 divide-y divide-gray-100">
            <SettingsRow icon={Crown} label="Live Translation Premium" value={premiumLabel} onClick={onOpenPaywall} />
          </div>
        </SettingsSection>

        <SettingsSection>
          <div className="-mx-4 divide-y divide-gray-100">
            <SettingsRow icon={Palette} label="Appearance" value={THEME_LABELS[settings.themeMode]} onClick={() => setPage('appearance')} />
            <SettingsRow icon={Languages} label="Languages" value="Change what you speak and translate to" onClick={onEditLanguages} />
          </div>
        </SettingsSection>

        <SettingsSection>
          <div className="-mx-4 divide-y divide-gray-100">
            <SettingsRow icon={User} label="Profile" value="Photo, name and status" onClick={() => setPage('profile')} />
            <SettingsRow icon={Lock} label="Privacy" value={`${blocked.length} blocked`} onClick={() => setPage('privacy')} />
            <SettingsRow icon={Bell} label="Notifications" onClick={() => setPage('notifications')} />
            <SettingsRow icon={Phone} label="Calls" onClick={() => setPage('calls')} />
          </div>
        </SettingsSection>

        <SettingsSection>
          <div className="-mx-4 divide-y divide-gray-100">
            <SettingsRow icon={HardDrive} label="Storage" value="Clear chat history" onClick={() => setPage('storage')} />
            <SettingsRow icon={Info} label="About" onClick={() => setPage('about')} />
          </div>
        </SettingsSection>
      </div>
    </div>
  );
}
