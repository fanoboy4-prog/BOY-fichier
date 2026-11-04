import { useState } from 'react';
import { Archive, ArrowLeft, Ban, Mail, MailOpen, MessageCircle, Pin, PinOff, Trash2 } from 'lucide-react';
import type { Contact } from '@/lib/contacts';
import { deleteChatHistory, getLastMessage } from '@/lib/chat';
import type { ChatMessage } from '@/lib/chat';
import { loadChatMeta, removeChatMeta, updateChatMeta } from '@/lib/chatMeta';
import type { ChatMeta, ChatMetaMap } from '@/lib/chatMeta';
import { ContextMenu } from '@/components/ContextMenu';
import type { ContextMenuItem } from '@/components/ContextMenu';
import { ChatRow } from '@/components/chats/ChatRow';
import type { SwipeAction } from '@/components/chats/ChatRow';

interface ChatsTabProps {
  contacts: Contact[];
  onOpenChat: (contact: Contact) => void;
  onBlock: (phone: string) => void;
}

interface ChatListItem {
  contact: Contact;
  lastMsg: ChatMessage | null;
  meta: ChatMeta;
}

interface MenuState {
  contact: Contact;
  x: number;
  y: number;
}

function compareItems(a: ChatListItem, b: ChatListItem): number {
  if (!!a.meta.pinned !== !!b.meta.pinned) return a.meta.pinned ? -1 : 1;
  return (b.lastMsg?.timestamp ?? 0) - (a.lastMsg?.timestamp ?? 0);
}

export function ChatsTab({ contacts, onOpenChat, onBlock }: ChatsTabProps) {
  const [metaMap, setMetaMap] = useState<ChatMetaMap>(() => loadChatMeta());
  const [showArchived, setShowArchived] = useState(false);
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Contact | null>(null);

  const items: ChatListItem[] = contacts.map((contact) => ({
    contact,
    lastMsg: getLastMessage(contact.id),
    meta: metaMap[contact.id] ?? {},
  }));
  const archivedItems = items.filter((i) => i.meta.archived).sort(compareItems);
  const activeItems = items.filter((i) => !i.meta.archived).sort(compareItems);
  const visibleItems = showArchived ? archivedItems : activeItems;

  const patchMeta = (contactId: string, patch: ChatMeta) => setMetaMap(updateChatMeta(contactId, patch));

  const toggleArchive = (contact: Contact) => {
    patchMeta(contact.id, { archived: !metaMap[contact.id]?.archived });
  };

  const openChat = (contact: Contact) => {
    if (metaMap[contact.id]?.unread) patchMeta(contact.id, { unread: false });
    onOpenChat(contact);
  };

  const deleteChat = (contact: Contact) => {
    deleteChatHistory(contact.id);
    setMetaMap(removeChatMeta(contact.id));
    setConfirmDelete(null);
  };

  const handleSwipe = (contact: Contact, action: SwipeAction) => {
    if (action === 'delete') setConfirmDelete(contact);
    else toggleArchive(contact);
  };

  const menuContact = menu?.contact ?? null;
  const menuMeta: ChatMeta = menuContact ? metaMap[menuContact.id] ?? {} : {};
  const menuItems: ContextMenuItem[] = menuContact ? [
    {
      icon: Archive,
      label: menuMeta.archived ? 'Désarchiver' : 'Archiver',
      action: () => toggleArchive(menuContact),
    },
    {
      icon: Trash2,
      label: 'Supprimer',
      color: 'text-red-600',
      action: () => setConfirmDelete(menuContact),
    },
    {
      icon: menuMeta.pinned ? PinOff : Pin,
      label: menuMeta.pinned ? 'Désépingler' : 'Épingler',
      action: () => patchMeta(menuContact.id, { pinned: !menuMeta.pinned }),
    },
    {
      icon: menuMeta.unread ? MailOpen : Mail,
      label: menuMeta.unread ? 'Marquer comme lu' : 'Marquer non lu',
      action: () => patchMeta(menuContact.id, { unread: !menuMeta.unread }),
    },
    {
      icon: Ban,
      label: 'Bloquer',
      color: 'text-orange-600',
      action: () => onBlock(menuContact.phone),
    },
  ] : [];

  return (
    <div className="flex flex-col h-full bg-white">
      {showArchived ? (
        <div className="flex items-center gap-3 px-3 py-3 bg-[#075E54] flex-shrink-0">
          <button
            onClick={() => setShowArchived(false)}
            aria-label="Retour"
            className="p-1 text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <p className="text-white font-bold text-base">Chats archivés</p>
        </div>
      ) : (
        <div className="px-4 py-2 bg-[#F0F2F5] flex-shrink-0">
          <p className="text-sm font-bold text-[#075E54]">Chats</p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {!showArchived && archivedItems.length > 0 && (
          <button
            onClick={() => setShowArchived(true)}
            className="w-full flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100"
          >
            <Archive className="w-5 h-5 text-[#075E54]" />
            <span className="flex-1 text-left text-sm font-semibold text-gray-900">Chats archivés</span>
            <span className="text-xs font-bold text-[#128C7E]">{archivedItems.length}</span>
          </button>
        )}

        {visibleItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-6">
            <MessageCircle className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm font-medium">
              {showArchived ? 'Aucun chat archivé' : 'No chats yet'}
            </p>
            {!showArchived && <p className="text-gray-400 text-xs mt-1">Add contacts to start translating</p>}
          </div>
        ) : (
          visibleItems.map(({ contact, lastMsg, meta }) => (
            <ChatRow
              key={contact.id}
              contact={contact}
              lastMsg={lastMsg}
              meta={meta}
              onOpen={() => openChat(contact)}
              onSwipeAction={(action) => handleSwipe(contact, action)}
              onLongPress={(x, y) => setMenu({ contact, x, y })}
            />
          ))
        )}
      </div>

      <ContextMenu
        visible={menu !== null}
        x={menu?.x ?? 0}
        y={menu?.y ?? 0}
        items={menuItems}
        onClose={() => setMenu(null)}
        header={menuContact ? <p className="text-sm font-bold text-gray-900 truncate">{menuContact.name}</p> : null}
      />

      {confirmDelete && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setConfirmDelete(null)} />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90%] max-w-sm bg-white rounded-2xl shadow-2xl p-5">
            <h2 className="text-base font-bold text-gray-900">Supprimer ce chat ?</h2>
            <p className="text-sm text-gray-600 mt-2">
              Les messages avec {confirmDelete.name} seront supprimés de cet appareil.
            </p>
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => deleteChat(confirmDelete)}
                className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
