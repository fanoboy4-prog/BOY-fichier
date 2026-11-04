import { X } from 'lucide-react';
import type { Contact } from '@/lib/contacts';

interface ForwardPickerProps {
  contacts: Contact[];
  onPick: (contact: Contact) => void;
  onClose: () => void;
}

export function ForwardPicker({ contacts, onPick, onClose }: ForwardPickerProps) {
  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40" onClick={onClose} />
      <div className="fixed left-1/2 -translate-x-1/2 bottom-0 z-50 w-full max-w-md bg-white rounded-t-2xl shadow-2xl overflow-hidden flex flex-col max-h-[70vh]">
        <div className="flex items-center justify-between px-4 py-3 bg-[#075E54]">
          <h2 className="text-white font-bold text-base">Transférer à</h2>
          <button onClick={onClose} aria-label="Fermer" className="p-1 text-white/80 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {contacts.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">Aucun autre contact.</p>
          ) : (
            contacts.map((contact) => (
              <button
                key={contact.id}
                onClick={() => onPick(contact)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50"
              >
                <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center text-white font-bold flex-shrink-0">
                  {contact.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-semibold text-gray-900 truncate">{contact.name}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </>
  );
}
