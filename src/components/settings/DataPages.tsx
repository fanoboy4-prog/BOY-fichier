import { useState } from 'react';
import { Languages } from 'lucide-react';
import { SettingsPage, SettingsSection } from '@/components/settings/SettingsUi';

const CHAT_KEY_PREFIX = 'lt_chat_';

export function StoragePage({ onBack }: { onBack: () => void }) {
  const [message, setMessage] = useState<string | null>(null);

  const handleClear = () => {
    if (!window.confirm('Delete all chat history on this device? This cannot be undone.')) return;
    Object.keys(localStorage)
      .filter((key) => key.startsWith(CHAT_KEY_PREFIX))
      .forEach((key) => localStorage.removeItem(key));
    setMessage('Chat history cleared.');
  };

  return (
    <SettingsPage title="Storage" onBack={onBack}>
      <SettingsSection title="Chats">
        <p className="text-sm text-gray-600">
          Removes every conversation and language pair saved on this device. Contacts and call history are kept.
        </p>
        <button
          onClick={handleClear}
          className="w-full py-3 rounded-xl bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100 transition-colors"
        >
          Clear all chats
        </button>
        {message && <p className="text-sm text-[#075E54] font-semibold">{message}</p>}
      </SettingsSection>
    </SettingsPage>
  );
}

export function AboutPage({ onBack }: { onBack: () => void }) {
  return (
    <SettingsPage title="About" onBack={onBack}>
      <SettingsSection>
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#075E54] flex items-center justify-center">
            <Languages className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">
            LIVE <span className="text-[#25D366]">TRANSLATION</span>
          </h3>
          <p className="text-xs text-gray-500">Version 1.0.0</p>
          <p className="text-sm text-gray-600">
            Talk, call and chat across languages. Speech is recognised in your language and translated into the one you pick.
          </p>
          <p className="text-xs text-gray-400 lowercase tracking-wide">app by boy STALL</p>
        </div>
      </SettingsSection>
    </SettingsPage>
  );
}
