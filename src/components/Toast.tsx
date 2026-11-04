import { UserPlus, X } from 'lucide-react';

export interface ToastMessage {
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}

interface ToastProps {
  message: ToastMessage;
  onDismiss: () => void;
}

export function Toast({ message, onDismiss }: ToastProps) {
  return (
    <div
      role="status"
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] w-[92%] max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 flex items-start gap-3"
    >
      <div className="w-9 h-9 rounded-full bg-[#075E54] flex items-center justify-center flex-shrink-0">
        <UserPlus className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-900">{message.title}</p>
        <p className="text-xs text-gray-600 mt-0.5">{message.body}</p>
        {message.actionLabel && message.onAction && (
          <button
            onClick={() => { message.onAction?.(); onDismiss(); }}
            className="mt-2 text-xs font-bold text-[#075E54] hover:underline"
          >
            {message.actionLabel}
          </button>
        )}
      </div>
      <button onClick={onDismiss} aria-label="Dismiss" className="p-1 text-gray-400 hover:text-gray-600">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
