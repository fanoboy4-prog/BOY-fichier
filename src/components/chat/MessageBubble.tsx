import { useRef, useState } from 'react';
import type { TouchEvent } from 'react';
import { Forward, Reply } from 'lucide-react';
import { formatClockTime } from '@/lib/chat';
import type { ChatMessage } from '@/lib/chat';
import { useLongPress } from '@/hooks/useLongPress';
import { findLang } from '@/lib/languages';
import { MessageTicks } from '@/components/chat/MessageTicks';

const SWIPE_TRIGGER = 56;
const SWIPE_MAX = 72;

interface MessageBubbleProps {
  msg: ChatMessage;
  translating: boolean;
  highlighted: boolean;
  onReply: () => void;
  onOpenMenu: (x: number, y: number) => void;
}

export function MessageBubble({ msg, translating, highlighted, onReply, onOpenMenu }: MessageBubbleProps) {
  const [offset, setOffset] = useState(0);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const swipingRef = useRef(false);

  const { handlers, isPressing } = useLongPress({
    onLongPress: (e) => {
      const point = 'touches' in e ? e.touches[0] : e;
      onOpenMenu(point.clientX, point.clientY);
    },
    delay: 450,
  });

  const isSent = msg.direction === 'sent';
  const deleted = msg.deletedForEveryone === true;

  const handleTouchStart = (e: TouchEvent) => {
    const t = e.touches[0];
    startRef.current = { x: t.clientX, y: t.clientY };
    swipingRef.current = false;
  };

  const handleTouchMove = (e: TouchEvent) => {
    const start = startRef.current;
    if (!start || deleted) return;
    const t = e.touches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (!swipingRef.current) {
      if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) {
        startRef.current = null;
        return;
      }
      if (dx > 8 && dx > Math.abs(dy)) swipingRef.current = true;
    }
    if (swipingRef.current) setOffset(Math.min(Math.max(dx, 0), SWIPE_MAX));
  };

  const handleTouchEnd = () => {
    if (swipingRef.current && offset >= SWIPE_TRIGGER) onReply();
    swipingRef.current = false;
    startRef.current = null;
    setOffset(0);
  };

  return (
    <div
      className={`relative flex ${isSent ? 'justify-end' : 'justify-start'}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <div
        aria-hidden
        className="absolute left-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 shadow flex items-center justify-center text-[#075E54]"
        style={{ opacity: Math.min(offset / SWIPE_TRIGGER, 1) }}
      >
        <Reply className="w-4 h-4" />
      </div>

      <div
        style={{ transform: `translateX(${offset}px)`, transition: offset === 0 ? 'transform 0.2s ease-out' : 'none' }}
        className="max-w-[80%]"
      >
        <div
          {...handlers}
          style={{ userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none' }}
          className={`rounded-lg px-2.5 pt-1.5 pb-1 shadow-sm transition-shadow ${
            isSent ? 'bg-[#E8F5E9] rounded-tr-none' : 'bg-white rounded-tl-none'
          } ${highlighted ? 'ring-2 ring-[#25D366]' : ''} ${isPressing ? 'brightness-95' : ''}`}
        >
          {msg.forwarded && !deleted && (
            <p className="flex items-center gap-1 text-[11px] italic text-[#555555] mb-0.5">
              <Forward className="w-3 h-3" /> Transféré
            </p>
          )}

          {msg.replyTo && !deleted && (
            <div className="mb-1 rounded-md bg-black/5 border-l-4 border-[#25D366] px-2 py-1">
              <p className="text-xs text-[#333333] truncate">{msg.replyTo.text}</p>
            </div>
          )}

          {deleted ? (
            <p className="text-sm italic text-gray-500">Ce message a été supprimé</p>
          ) : (
            <div className="flex items-end gap-2">
              <p className="text-[15px] font-bold text-[#111111] leading-snug whitespace-pre-wrap break-words">{msg.text}</p>
              <span className="text-[11px] flex-shrink-0 mb-px">{findLang(msg.sourceLang).flag}</span>
            </div>
          )}

          {!deleted && (translating || msg.translation) && (
            <div className="mt-1 pt-1 border-t border-black/10">
              <p className="text-[13px] text-[#333333] leading-relaxed">
                {translating ? 'Traduction…' : msg.translation}
              </p>
            </div>
          )}

          <div className="flex items-center justify-end gap-1 mt-0.5">
            <span className="text-[10px] text-[#555555]">{formatClockTime(msg.timestamp)}</span>
            {isSent && !deleted && <MessageTicks status={msg.status ?? 'read'} />}
          </div>
        </div>
      </div>
    </div>
  );
}
