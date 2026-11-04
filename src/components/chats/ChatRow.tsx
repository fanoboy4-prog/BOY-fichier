import { useRef, useState } from 'react';
import type { TouchEvent } from 'react';
import { Archive, Pin, Trash2 } from 'lucide-react';
import type { Contact } from '@/lib/contacts';
import type { ChatMessage } from '@/lib/chat';
import type { ChatMeta } from '@/lib/chatMeta';
import { avatarColor } from '@/lib/avatar';
import { useLongPress } from '@/hooks/useLongPress';
import { MessageTicks } from '@/components/chat/MessageTicks';

const ACTION_THRESHOLD = 96;
const MAX_SWIPE = 140;

export type SwipeAction = 'archive' | 'delete';

interface ChatRowProps {
  contact: Contact;
  lastMsg: ChatMessage | null;
  meta: ChatMeta;
  onOpen: () => void;
  onSwipeAction: (action: SwipeAction) => void;
  onLongPress: (x: number, y: number) => void;
}

function formatListTime(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Hier';
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}

export function ChatRow({ contact, lastMsg, meta, onOpen, onSwipeAction, onLongPress }: ChatRowProps) {
  const [offset, setOffset] = useState(0);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const swipingRef = useRef(false);

  const { isPressing, handlers } = useLongPress({
    onLongPress: (e) => {
      const point = 'touches' in e ? e.touches[0] : e;
      onLongPress(point.clientX, point.clientY);
    },
    onClick: () => {
      if (!swipingRef.current) onOpen();
    },
    delay: 450,
  });

  const handleTouchStart = (e: TouchEvent) => {
    handlers.onTouchStart(e);
    const t = e.touches[0];
    startRef.current = { x: t.clientX, y: t.clientY };
    swipingRef.current = false;
  };

  const handleTouchMove = (e: TouchEvent) => {
    handlers.onTouchMove();
    const start = startRef.current;
    if (!start) return;
    const t = e.touches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (!swipingRef.current) {
      if (Math.abs(dx) < 8 || Math.abs(dy) > Math.abs(dx)) return;
      swipingRef.current = true;
    }
    setOffset(Math.max(-MAX_SWIPE, Math.min(MAX_SWIPE, dx)));
  };

  const handleTouchEnd = () => {
    handlers.onTouchEnd();
    if (swipingRef.current) {
      if (offset <= -ACTION_THRESHOLD) onSwipeAction('archive');
      else if (offset >= ACTION_THRESHOLD) onSwipeAction('delete');
    }
    swipingRef.current = false;
    startRef.current = null;
    setOffset(0);
  };

  const previewText = lastMsg
    ? (lastMsg.deletedForEveryone ? 'Message supprimé' : lastMsg.translation || lastMsg.text)
    : `Tap to start translating with ${contact.name}`;

  return (
    <div className="relative overflow-hidden">
      <div aria-hidden className="absolute inset-0 flex">
        <div className="w-1/2 bg-red-600 flex items-center gap-2 pl-5 text-white">
          <Trash2 className="w-5 h-5" />
          <span className="text-sm font-semibold">Supprimer</span>
        </div>
        <div className="w-1/2 ml-auto bg-gray-500 flex items-center justify-end gap-2 pr-5 text-white">
          <span className="text-sm font-semibold">{meta.archived ? 'Désarchiver' : 'Archiver'}</span>
          <Archive className="w-5 h-5" />
        </div>
      </div>

      <div
        {...handlers}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        style={{
          transform: `translateX(${offset}px)`,
          transition: offset === 0 ? 'transform 0.2s ease-out' : 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          WebkitTouchCallout: 'none',
        }}
        className={`relative flex items-center gap-3 px-4 py-3 border-b border-gray-100 cursor-pointer ${
          isPressing ? 'bg-gray-100' : 'bg-white'
        }`}
      >
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
          style={{ backgroundColor: avatarColor(contact.name) }}
        >
          {contact.name.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-gray-900 font-semibold text-sm truncate">{contact.name}</p>
            {meta.pinned && <Pin aria-label="Épinglé" className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />}
          </div>
          <div className="flex items-center gap-1 mt-0.5 min-w-0">
            {lastMsg?.direction === 'sent' && !lastMsg.deletedForEveryone && (
              <MessageTicks status={lastMsg.status ?? 'read'} />
            )}
            <p className="text-gray-500 text-xs truncate">{previewText}</p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          {lastMsg && (
            <span className={`text-xs ${meta.unread ? 'text-[#128C7E] font-semibold' : 'text-gray-400'}`}>
              {formatListTime(lastMsg.timestamp)}
            </span>
          )}
          {meta.unread && <span aria-label="Non lu" className="w-2.5 h-2.5 rounded-full bg-[#25D366]" />}
        </div>
      </div>
    </div>
  );
}
