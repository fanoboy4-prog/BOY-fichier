import { useState } from 'react';
import type { ChangeEvent } from 'react';
import { readImageAsDataUrl } from '@/lib/imageFile';
import { COUNTRY_CODES } from '@/lib/contacts';
import type { Profile } from '@/lib/appSettings';
import { SettingsPage, SettingsSection } from '@/components/settings/SettingsUi';

interface ProfilePageProps {
  profile: Profile;
  onSave: (patch: Partial<Profile>) => void;
  onBack: () => void;
}

export function ProfilePage({ profile, onSave, onBack }: ProfilePageProps) {
  const [name, setName] = useState(profile.name);
  const [status, setStatus] = useState(profile.status);
  const [countryCode, setCountryCode] = useState(profile.countryCode);
  const [phone, setPhone] = useState(profile.phone);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const cleanPhoneNumber = (value: string, code: string) => {
  let n = value.replace(/[\s\-\.\(\)]/g, '');
  if (n.startsWith('+')) n = n.slice(1);
  const codeDigits = code.replace('+', '');
  if (n.startsWith(codeDigits)) n = n.slice(codeDigits.length);
  if (n.startsWith('0')) n = n.slice(1);
  return n.replace(/\D/g, '');
};
  const dirty =
    name.trim() !== profile.name ||
    status.trim() !== profile.status ||
    countryCode !== profile.countryCode ||
    phone.trim() !== profile.phone;

  const handleAvatar = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const avatar = await readImageAsDataUrl(file, 256, 0.85);
      onSave({ avatar });
      setError(null);
    } catch {
      setError('That image could not be used. Try another one.');
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      setError('Name cannot be empty.');
      return;
    }
    const cleanPhone = cleanPhoneNumber(phone, countryCode);
    onSave({ name: name.trim(), status: status.trim(), countryCode, phone: cleanPhone });
    setError(null);
    setSaved(true);
  };

  return (
    <SettingsPage title="Profile" onBack={onBack}>
      <SettingsSection>
        <div className="flex flex-col items-center gap-3 py-2">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-[#075E54] flex items-center justify-center text-white text-3xl font-bold">
            {profile.avatar ? (
              <img src={profile.avatar} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              name.trim().charAt(0).toUpperCase() || '?'
            )}
          </div>
          <label className="px-4 py-2 rounded-xl bg-[#075E54] text-white text-sm font-semibold cursor-pointer hover:opacity-90 transition-opacity">
            Change photo
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
          </label>
        </div>
      </SettingsSection>

      <SettingsSection title="Name">
        <input
          type="text"
          value={name}
          maxLength={40}
          onChange={(e) => { setName(e.target.value); setSaved(false); }}
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#075E54]"
        />
      </SettingsSection>

      <SettingsSection title="Status">
        <input
          type="text"
          value={status}
          maxLength={80}
          onChange={(e) => { setStatus(e.target.value); setSaved(false); }}
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#075E54]"
        />
      </SettingsSection>

      <SettingsSection title="Phone">
        <p className="text-xs text-gray-500">Friends use this number to send you contact requests.</p>
        <div className="flex gap-2">
          <select
            value={countryCode}
            onChange={(e) => { setCountryCode(e.target.value); setSaved(false); }}
            aria-label="Country code"
            className="rounded-xl border border-gray-200 bg-white px-2 py-2 text-sm text-gray-800 outline-none focus:border-[#075E54]"
          >
            {COUNTRY_CODES.map((c) => (
              <option key={c.code} value={c.code}>{c.flag} {c.dial}</option>
            ))}
          </select>
          <input
            type="tel"
            value={phone}
            maxLength={20}
            placeholder="Phone number"
            onChange={(e) => { setPhone(cleanPhoneNumber(e.target.value, countryCode)); setSaved(false); }}
            className="flex-1 min-w-0 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#075E54]"
          />
        </div>
      </SettingsSection>

      {error && <p className="text-sm text-red-500 px-1">{error}</p>}
      {saved && !dirty && <p className="text-sm text-[#075E54] font-semibold px-1">Profile saved.</p>}

      <button
        onClick={handleSave}
        disabled={!dirty}
        className="w-full py-3 rounded-xl bg-[#075E54] text-white font-bold text-sm transition-opacity disabled:opacity-40"
      >
        Save profile
      </button>
    </SettingsPage>
  );
}
