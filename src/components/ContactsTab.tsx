import { useState } from 'react';
import {
  Plus, Phone, Video, X, Search, ChevronDown, User2,
  Trash2, MessageSquare, Ban, Info, Pencil, UserPlus,
} from 'lucide-react';
import { COUNTRY_CODES } from '@/lib/contacts';
import type { Contact, CountryCode } from '@/lib/contacts';
import type { ContactRequest, RequestStatus } from '@/lib/contactRequests';
import { useLongPress } from '@/hooks/useLongPress';
import { ContextMenu } from '@/components/ContextMenu';
import type { ContextMenuItem } from '@/components/ContextMenu';
import { RequestStatusBadge } from '@/components/ContactRequestsScreen';

interface ContactsTabProps {
  contacts: Contact[];
  requests: ContactRequest[];
  pendingIncomingCount: number;
  onAdd: (name: string, phone: string, countryCode: string) => string | null;
  onOpenRequests: () => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, name: string, phone: string, countryCode: string) => void;
  onCall: (contact: Contact, type: 'voice' | 'video') => void;
  onBlock: (phone: string) => void;
  onOpenChat: (contact: Contact) => void;
}

function getInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?';
}

function avatarColor(name: string): string {
  const colors = ['#25D366', '#075E54', '#34B7F1', '#E67E22', '#9B59B6', '#E74C3C', '#1ABC9C', '#3498DB'];
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx];
}

export function ContactsTab({
  contacts,
  requests,
  pendingIncomingCount,
  onAdd,
  onOpenRequests,
  onDelete,
  onEdit,
  onCall,
  onBlock,
  onOpenChat,
}: ContactsTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [infoContact, setInfoContact] = useState<Contact | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState<CountryCode>(COUNTRY_CODES[0]);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [search, setSearch] = useState('');

  // Context menu state
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const [menuContact, setMenuContact] = useState<Contact | null>(null);

  const handleOpenMenu = (contact: Contact, e: React.TouchEvent | React.MouseEvent) => {
    const touch = 'touches' in e ? e.touches[0] ?? e.changedTouches[0] : null;
    const x = touch ? touch.clientX : (e as React.MouseEvent).clientX;
    const y = touch ? touch.clientY : (e as React.MouseEvent).clientY;
    setMenuPos({ x, y });
    setMenuContact(contact);
    setMenuVisible(true);
  };

  const menuItems: ContextMenuItem[] = menuContact ? [
    {
      icon: MessageSquare,
      label: 'Send SMS',
      action: () => { setInfoContact(menuContact); },
    },
    {
      icon: Pencil,
      label: 'Edit',
      action: () => {
        setEditingContact(menuContact);
        setName(menuContact.name);
        setPhone(menuContact.phone);
        setCountry(COUNTRY_CODES.find((c) => c.code === menuContact.countryCode) ?? COUNTRY_CODES[0]);
        setShowForm(true);
      },
    },
    {
      icon: Info,
      label: 'View Info',
      action: () => { setInfoContact(menuContact); },
    },
    {
      icon: Ban,
      label: 'Block',
      color: 'text-orange-500',
      action: () => { onBlock(menuContact.phone); },
    },
    {
      icon: Trash2,
      label: 'Delete',
      color: 'text-red-500',
      action: () => { onDelete(menuContact.id); },
    },
  ] : [];

  const statusOf = (contact: Contact) =>
    contact.requestId ? requests.find((r) => r.id === contact.requestId)?.status : undefined;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    if (editingContact) {
      onEdit(editingContact.id, name, phone, country.code);
      setEditingContact(null);
    } else {
      const error = onAdd(name, phone, country.code);
      if (error) {
        setFormError(error);
        return;
      }
    }
    setFormError(null);
    setName('');
    setPhone('');
    setCountry(COUNTRY_CODES[0]);
    setShowForm(false);
  };

  const filtered = contacts.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search),
  );

  const getCountry = (code: string) => COUNTRY_CODES.find((c) => c.code === code) ?? COUNTRY_CODES[0];

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Search bar */}
      <div className="px-3 py-2 bg-[#F0F2F5] flex-shrink-0">
        <div className="flex items-center gap-2 bg-white rounded-full px-3 py-1.5">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search contacts..."
            className="flex-1 text-sm bg-transparent outline-none text-gray-800 placeholder:text-gray-400"
          />
        </div>
      </div>

      <button
        onClick={onOpenRequests}
        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors flex-shrink-0"
      >
        <div className="w-12 h-12 rounded-full bg-[#075E54]/10 flex items-center justify-center">
          <UserPlus className="w-5 h-5 text-[#075E54]" />
        </div>
        <span className="flex-1 text-left text-base font-semibold text-[#075E54]">Demandes</span>
        {pendingIncomingCount > 0 && (
          <span className="min-w-[1.5rem] h-6 px-2 rounded-full bg-[#075E54] text-white text-xs font-bold flex items-center justify-center">
            {pendingIncomingCount}
          </span>
        )}
      </button>

      {/* New Contact button */}
      <button
        onClick={() => { setFormError(null); setShowForm(true); }}
        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors flex-shrink-0 border-b border-gray-100"
      >
        <div className="w-12 h-12 rounded-full bg-[#25D366] flex items-center justify-center">
          <Plus className="w-6 h-6 text-white" />
        </div>
        <span className="text-base font-semibold text-[#075E54]">New Contact</span>
      </button>

      {/* Contact list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-6">
            <User2 className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-gray-400 text-sm font-medium">No contacts yet</p>
            <p className="text-gray-300 text-xs mt-1">Tap "New Contact" to add someone</p>
          </div>
        ) : (
          filtered.map((contact) => {
            const c = getCountry(contact.countryCode);
            return (
              <ContactRow
                key={contact.id}
                contact={contact}
                countryFlag={c.flag}
                countryDial={c.dial}
                status={statusOf(contact)}
                onCall={onCall}
                onOpenChat={onOpenChat}
                onLongPress={(e) => handleOpenMenu(contact, e)}
              />
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 py-3 text-center">
        <p className="text-xs text-gray-400 lowercase tracking-wide">app by boy STALL</p>
      </div>

      {/* Context Menu */}
      <ContextMenu
        visible={menuVisible}
        x={menuPos.x}
        y={menuPos.y}
        items={menuItems}
        onClose={() => setMenuVisible(false)}
        header={
          menuContact ? (
            <div className="flex items-center gap-2.5">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                style={{ backgroundColor: avatarColor(menuContact.name) }}
              >
                {getInitial(menuContact.name)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{menuContact.name}</p>
                <p className="text-xs text-gray-500 truncate">{getCountry(menuContact.countryCode).flag} {getCountry(menuContact.countryCode).dial} {menuContact.phone}</p>
              </div>
            </div>
          ) : null
        }
      />

      {/* New/Edit Contact Form Modal */}
      {showForm && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40" onClick={() => { setShowForm(false); setEditingContact(null); }} />
          <div className="fixed left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-50 w-[90%] max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-[#075E54]">
              <h2 className="text-white font-bold text-base">{editingContact ? 'Edit Contact' : 'New Contact'}</h2>
              <button onClick={() => { setShowForm(false); setEditingContact(null); }} className="p-1 text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contact name"
                  autoFocus
                  className="w-full mt-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#25D366] focus:border-transparent"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Phone</label>
                <div className="flex gap-2 mt-1">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowCountryPicker((p) => !p)}
                      className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-base">{country.flag}</span>
                      <span className="font-medium">{country.dial}</span>
                      <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                    {showCountryPicker && (
                      <>
                        <div className="fixed inset-0 z-50" onClick={() => setShowCountryPicker(false)} />
                        <div className="absolute left-0 top-full mt-1 z-50 w-56 max-h-64 overflow-y-auto bg-white rounded-xl shadow-2xl border border-gray-100">
                          {COUNTRY_CODES.map((c) => (
                            <button
                              key={c.code}
                              type="button"
                              onClick={() => { setCountry(c); setShowCountryPicker(false); }}
                              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-gray-50 transition-colors text-left ${
                                country.code === c.code ? 'bg-[#25D366]/10' : ''
                              }`}
                            >
                              <span className="text-lg">{c.flag}</span>
                              <span className="flex-1 text-gray-800 font-medium">{c.name}</span>
                              <span className="text-gray-500 text-xs">{c.dial}</span>
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Phone number"
                    className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#25D366] focus:border-transparent"
                  />
                </div>
                {formError && <p className="mt-2 text-xs text-red-500">{formError}</p>}
              </div>
              <button
                type="submit"
                disabled={!name.trim() || !phone.trim()}
                className="w-full py-3 rounded-xl bg-[#25D366] text-white font-bold text-sm hover:bg-[#1da851] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingContact ? 'Save Changes' : 'Save Contact'}
              </button>
            </form>
          </div>
        </>
      )}

      {/* Info Modal */}
      {infoContact && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setInfoContact(null)} />
          <div className="fixed left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-50 w-[90%] max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-[#075E54]">
              <h2 className="text-white font-bold text-base">Contact Info</h2>
              <button onClick={() => setInfoContact(null)} className="p-1 text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 flex flex-col items-center">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-3xl mb-3"
                style={{ backgroundColor: avatarColor(infoContact.name) }}
              >
                {getInitial(infoContact.name)}
              </div>
              <p className="text-lg font-bold text-gray-900">{infoContact.name}</p>
              <p className="text-gray-500 text-sm mt-1">{getCountry(infoContact.countryCode).flag} {getCountry(infoContact.countryCode).dial} {infoContact.phone}</p>
              <div className="flex gap-4 mt-5">
                <button
                  onClick={() => { onCall(infoContact, 'voice'); setInfoContact(null); }}
                  className="flex flex-col items-center gap-1.5"
                >
                  <div className="w-12 h-12 rounded-full bg-[#25D366]/10 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-[#25D366]" />
                  </div>
                  <span className="text-xs text-gray-600 font-medium">Call</span>
                </button>
                <button
                  onClick={() => { onCall(infoContact, 'video'); setInfoContact(null); }}
                  className="flex flex-col items-center gap-1.5"
                >
                  <div className="w-12 h-12 rounded-full bg-[#075E54]/10 flex items-center justify-center">
                    <Video className="w-5 h-5 text-[#075E54]" />
                  </div>
                  <span className="text-xs text-gray-600 font-medium">Video</span>
                </button>
                <button
                  onClick={() => {
                    setEditingContact(infoContact);
                    setName(infoContact.name);
                    setPhone(infoContact.phone);
                    setCountry(COUNTRY_CODES.find((c) => c.code === infoContact.countryCode) ?? COUNTRY_CODES[0]);
                    setShowForm(true);
                    setInfoContact(null);
                  }}
                  className="flex flex-col items-center gap-1.5"
                >
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                    <Pencil className="w-5 h-5 text-gray-600" />
                  </div>
                  <span className="text-xs text-gray-600 font-medium">Edit</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Contact row with long-press ────────────────────────────────────────────

function ContactRow({
  contact,
  countryFlag,
  countryDial,
  status,
  onCall,
  onOpenChat,
  onLongPress,
}: {
  contact: Contact;
  countryFlag: string;
  countryDial: string;
  status?: RequestStatus;
  onCall: (contact: Contact, type: 'voice' | 'video') => void;
  onOpenChat: (contact: Contact) => void;
  onLongPress: (e: React.TouchEvent | React.MouseEvent) => void;
}) {
  const { isPressing, handlers } = useLongPress({
    onLongPress: (e) => onLongPress(e),
    delay: 500,
  });

  return (
    <div
      {...handlers}
      className={`group flex items-center gap-3 px-4 py-2.5 transition-colors border-b border-gray-50 ${
        isPressing ? 'bg-gray-100' : 'hover:bg-gray-50'
      }`}
      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
    >
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
        style={{ backgroundColor: avatarColor(contact.name) }}
      >
        {getInitial(contact.name)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-gray-900 font-semibold text-sm truncate">{contact.name}</p>
        <p className="text-gray-500 text-xs truncate">{countryFlag} {countryDial} {contact.phone}</p>
        {status && <div className="mt-1"><RequestStatusBadge status={status} /></div>}
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
        
        onClick={(e) => { e.stopPropagation(); onOpenChat(contact); }}
        className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100"
        aria-label="Open chat"
      >
        <MessageSquare className="w-5 h-5" />
      </button>
              <button
          onClick={(e) => { e.stopPropagation(); onCall(contact, 'voice'); }}
          className="w-10 h-10 rounded-full flex items-center justify-center text-[#25D366] hover:bg-[#25D366]/10 transition-colors"
          aria-label="Voice call"
        >
          <Phone className="w-5 h-5" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onCall(contact, 'video'); }}
          className="w-10 h-10 rounded-full flex items-center justify-center text-[#075E54] hover:bg-[#075E54]/10 transition-colors"
          aria-label="Video call"
        >
          <Video className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
