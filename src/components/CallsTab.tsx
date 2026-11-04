import { useState } from 'react';
import {
  Phone, Video, PhoneOutgoing, PhoneIncoming, PhoneMissed,
  Trash2, MessageSquare, Ban, Info, UserPlus,
} from 'lucide-react';
import type { CallLogEntry } from '@/lib/contacts';
import { useLongPress } from '@/hooks/useLongPress';
import { ContextMenu } from '@/components/ContextMenu';
import type { ContextMenuItem } from '@/components/ContextMenu';

interface CallsTabProps {
  logs: CallLogEntry[];
  onCall: (entry: CallLogEntry) => void;
  onDelete: (id: string) => void;
}

function formatTime(ts: number): string {
  const now = Date.now();
  const diff = now - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}

function formatDuration(secs: number): string {
  if (secs === 0) return '';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return ` · ${m}:${s.toString().padStart(2, '0')}`;
}

export function CallsTab({ logs, onCall, onDelete }: CallsTabProps) {
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const [menuEntry, setMenuEntry] = useState<CallLogEntry | null>(null);

  const handleOpenMenu = (entry: CallLogEntry, e: React.TouchEvent | React.MouseEvent) => {
    const touch = 'touches' in e ? e.touches[0] ?? e.changedTouches[0] : null;
    const x = touch ? touch.clientX : (e as React.MouseEvent).clientX;
    const y = touch ? touch.clientY : (e as React.MouseEvent).clientY;
    setMenuPos({ x, y });
    setMenuEntry(entry);
    setMenuVisible(true);
  };

  const menuItems: ContextMenuItem[] = menuEntry ? [
    {
      icon: Phone,
      label: menuEntry.type === 'video' ? 'Video Call' : 'Voice Call',
      action: () => onCall(menuEntry),
    },
    {
      icon: MessageSquare,
      label: 'Send SMS',
      action: () => { /* placeholder */ },
    },
    {
      icon: UserPlus,
      label: 'Add to Contacts',
      action: () => { /* placeholder */ },
    },
    {
      icon: Info,
      label: 'View Info',
      action: () => { /* placeholder */ },
    },
    {
      icon: Ban,
      label: 'Block',
      color: 'text-orange-500',
      action: () => { /* placeholder */ },
    },
    {
      icon: Trash2,
      label: 'Delete',
      color: 'text-red-500',
      action: () => { onDelete(menuEntry.id); },
    },
  ] : [];

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="px-4 py-2 bg-[#F0F2F5] flex-shrink-0">
        <p className="text-sm font-bold text-[#075E54]">Recent</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-6">
            <Phone className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-gray-400 text-sm font-medium">No recent calls</p>
            <p className="text-gray-300 text-xs mt-1">Call a contact to see it here</p>
          </div>
        ) : (
          logs.map((entry) => (
            <CallRow
              key={entry.id}
              entry={entry}
              onCall={onCall}
              onLongPress={(e) => handleOpenMenu(entry, e)}
            />
          ))
        )}
      </div>

      {/* Context Menu */}
      <ContextMenu
        visible={menuVisible}
        x={menuPos.x}
        y={menuPos.y}
        items={menuItems}
        onClose={() => setMenuVisible(false)}
        header={
          menuEntry ? (
            <div className="flex items-center gap-2.5">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 ${
                menuEntry.status === 'missed' ? 'bg-[#E74C3C]' : 'bg-[#075E54]'
              }`}>
                {menuEntry.contactName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{menuEntry.contactName}</p>
                <p className="text-xs text-gray-500 truncate">
                  {menuEntry.status === 'missed' ? 'Missed' : menuEntry.direction === 'outgoing' ? 'Outgoing' : 'Incoming'}
                  {' · '}{formatTime(menuEntry.timestamp)}
                </p>
              </div>
            </div>
          ) : null
        }
      />
    </div>
  );
}

// ─── Call row with long-press ───────────────────────────────────────────────

function CallRow({
  entry,
  onCall,
  onLongPress,
}: {
  entry: CallLogEntry;
  onCall: (entry: CallLogEntry) => void;
  onLongPress: (e: React.TouchEvent | React.MouseEvent) => void;
}) {
  const { isPressing, handlers } = useLongPress({
    onLongPress: (e) => onLongPress(e),
    onClick: () => onCall(entry),
    delay: 500,
  });

  const isVideo = entry.type === 'video';
  const isMissed = entry.status === 'missed';
  const isOutgoing = entry.direction === 'outgoing' && !isMissed;

  return (
    <div
      {...handlers}
      className={`w-full flex items-center gap-3 px-4 py-3 transition-colors border-b border-gray-50 text-left ${
        isPressing ? 'bg-gray-100' : 'hover:bg-gray-50'
      }`}
      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
    >
      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 ${
        isMissed ? 'bg-[#E74C3C]' : 'bg-[#075E54]'
      }`}>
        {entry.contactName.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-semibold text-sm truncate ${isMissed ? 'text-[#E74C3C]' : 'text-gray-900'}`}>
          {entry.contactName}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          {isMissed ? (
            <PhoneMissed className="w-3.5 h-3.5 text-[#E74C3C]" />
          ) : isOutgoing ? (
            <PhoneOutgoing className="w-3.5 h-3.5 text-[#25D366]" />
          ) : (
            <PhoneIncoming className="w-3.5 h-3.5 text-gray-400" />
          )}
          <span className="text-gray-500 text-xs">
            {isMissed ? 'Missed' : ''} {formatTime(entry.timestamp)}{formatDuration(entry.duration)}
          </span>
          <span className="text-gray-400 text-xs ml-auto flex items-center gap-0.5">
            {isVideo ? <Video className="w-3 h-3" /> : <Phone className="w-3 h-3" />}
          </span>
        </div>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onCall(entry); }}
        className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-[#25D366] hover:bg-[#25D366]/10 transition-colors"
        aria-label="Call back"
      >
        {isVideo ? <Video className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
      </button>
    </div>
  );
}
