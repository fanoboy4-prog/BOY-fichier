import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

export interface ContextMenuItem {
  icon: typeof X;
  label: string;
  action: () => void;
  color?: string;
}

interface ContextMenuProps {
  visible: boolean;
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
  header?: ReactNode;
}

export function ContextMenu({ visible, x, y, items, onClose, header }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!visible) return;
    const handleOutside = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
    };
  }, [visible, onClose]);

  if (!visible) return null;

  // Clamp position to viewport
  const menuWidth = 220;
  const menuHeight = items.length * 48 + (header ? 64 : 0) + 16;
  const clampedX = Math.min(x, window.innerWidth - menuWidth - 8);
  const clampedY = Math.min(y, window.innerHeight - menuHeight - 8);

  return (
    <>
      {/* Backdrop — also catches touch/click for closing */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Menu card */}
      <div
        ref={menuRef}
        className="fixed z-50 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden py-1.5"
        style={{
          left: Math.max(8, clampedX),
          top: Math.max(8, clampedY),
          width: menuWidth,
          animation: 'contextMenuIn 0.15s ease-out',
        }}
      >
        {header && (
          <div className="px-4 py-3 border-b border-gray-100 mb-1">
            {header}
          </div>
        )}
        {items.map((item, i) => {
          const Icon = item.icon;
          return (
            <button
              key={i}
              onClick={() => {
                item.action();
                onClose();
              }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
            >
              <Icon className={`w-4.5 h-4.5 flex-shrink-0 ${item.color ?? 'text-gray-600'}`} style={{ width: 18, height: 18 }} />
              <span className={`text-sm font-medium ${item.color ?? 'text-gray-800'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}
