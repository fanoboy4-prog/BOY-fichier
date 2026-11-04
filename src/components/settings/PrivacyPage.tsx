import { Ban } from 'lucide-react';
import type { AppSettings } from '@/lib/appSettings';
import { SettingsPage, SettingsSection, ToggleRow } from '@/components/settings/SettingsUi';

interface PrivacyPageProps {
  blocked: string[];
  onUnblock: (phone: string) => void;
  onBack: () => void;
}

export function PrivacyPage({ blocked, onUnblock, onBack }: PrivacyPageProps) {
  return (
    <SettingsPage title="Privacy" onBack={onBack}>
      <SettingsSection title={`Blocked numbers (${blocked.length})`}>
        {blocked.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <Ban className="w-8 h-8 text-gray-300" />
            <p className="text-sm text-gray-500">No blocked numbers. Block a contact from the Contacts tab.</p>
          </div>
        ) : (
          <ul className="-mx-4 divide-y divide-gray-100">
            {blocked.map((phone) => (
              <li key={phone} className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="text-sm font-semibold text-gray-800">{phone}</span>
                <button
                  onClick={() => onUnblock(phone)}
                  className="px-3 py-1.5 rounded-lg bg-[#075E54] text-white text-xs font-semibold hover:opacity-90 transition-opacity"
                >
                  Unblock
                </button>
              </li>
            ))}
          </ul>
        )}
      </SettingsSection>
    </SettingsPage>
  );
}

interface PreferencePageProps {
  settings: AppSettings;
  onChange: (patch: Partial<AppSettings>) => void;
  onBack: () => void;
}

export function NotificationsPage({ settings, onChange, onBack }: PreferencePageProps) {
  const { notifications } = settings;
  return (
    <SettingsPage title="Notifications" onBack={onBack}>
      <SettingsSection>
        <div className="-mx-4 divide-y divide-gray-100">
          <ToggleRow
            label="Sound"
            description="Play the ringtone and busy tone"
            checked={notifications.sound}
            onChange={(sound) => onChange({ notifications: { ...notifications, sound } })}
          />
          <ToggleRow
            label="Vibrate"
            description="Vibrate when a call comes in"
            checked={notifications.vibrate}
            onChange={(vibrate) => onChange({ notifications: { ...notifications, vibrate } })}
          />
        </div>
      </SettingsSection>
    </SettingsPage>
  );
}

export function CallsPage({ settings, onChange, onBack }: PreferencePageProps) {
  return (
    <SettingsPage title="Calls" onBack={onBack}>
      <SettingsSection>
        <div className="-mx-4">
          <ToggleRow
            label="Auto-translate"
            description="Start live translation as soon as a call connects"
            checked={settings.calls.autoTranslate}
            onChange={(autoTranslate) => onChange({ calls: { ...settings.calls, autoTranslate } })}
          />
        </div>
      </SettingsSection>
    </SettingsPage>
  );
}
