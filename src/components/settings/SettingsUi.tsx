import type { ReactNode } from 'react';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export function SettingsPage({ title, onBack, children }: { title: string; onBack: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#F0F2F5] max-w-md mx-auto">
      <div className="flex-shrink-0 bg-[#075E54] px-3 py-3 flex items-center gap-3 shadow-md">
        <button
          onClick={onBack}
          aria-label="Back"
          className="text-white p-1 hover:bg-white/10 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-white font-bold text-lg">{title}</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">{children}</div>
    </div>
  );
}

export function SettingsSection({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {title && (
        <h3 className="px-4 pt-3 pb-1 text-xs font-bold uppercase tracking-wide text-[#075E54]">{title}</h3>
      )}
      <div className="p-4 space-y-3">{children}</div>
    </section>
  );
}

export function SettingsRow({
  icon: Icon,
  label,
  value,
  onClick,
  danger,
}: {
  icon: LucideIcon;
  label: string;
  value?: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
    >
      <Icon className={`w-5 h-5 flex-shrink-0 ${danger ? 'text-red-500' : 'text-[#075E54]'}`} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${danger ? 'text-red-500' : 'text-gray-800'}`}>{label}</p>
        {value && <p className="text-xs text-gray-500 truncate">{value}</p>}
      </div>
      <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
    </button>
  );
}

export function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 px-4 py-3 cursor-pointer">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800">{label}</p>
        {description && <p className="text-xs text-gray-500">{description}</p>}
      </div>
      <input
        type="checkbox"
        role="switch"
        aria-checked={checked}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only peer"
      />
      <span className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${checked ? 'bg-[#25D366]' : 'bg-gray-300'}`}>
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : ''}`}
        />
      </span>
    </label>
  );
}
