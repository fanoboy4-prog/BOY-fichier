import { MessageCircle, Phone, Users } from 'lucide-react';
import type { Tab } from '@/lib/contacts';

interface TabBarProps {
  active: Tab;
  onChange: (tab: Tab) => void;
}

const TABS: { id: Tab; label: string; icon: typeof MessageCircle }[] = [
  { id: 'chats', label: 'Chats', icon: MessageCircle },
  { id: 'calls', label: 'Calls', icon: Phone },
  { id: 'contacts', label: 'Contacts', icon: Users },
];

export function TabBar({ active, onChange }: TabBarProps) {
  return (
    <div className="flex-shrink-0 bg-[#075E54] flex items-center justify-around h-14">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActiveTab = active === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
              isActiveTab ? 'text-white' : 'text-white/60 hover:text-white/80'
            }`}
          >
            <Icon className={`w-5 h-5 ${isActiveTab ? 'fill-white/20' : ''}`} />
            <span className="text-[10px] font-bold uppercase tracking-wide">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
