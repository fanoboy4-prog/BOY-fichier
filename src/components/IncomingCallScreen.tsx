import { useEffect, useRef } from 'react';
import { PhoneIncoming, PhoneOff } from 'lucide-react';
import { playRingtone, stopRingtone } from '@/lib/ringtone';

const RING_TIMEOUT_MS = 30000;

interface IncomingCallScreenProps {
  callerName: string;
  notifications: { sound: boolean; vibrate: boolean };
  onAnswer: () => void;
  onDecline: () => void;
}

export function IncomingCallScreen({ callerName, notifications, onAnswer, onDecline }: IncomingCallScreenProps) {
  const onDeclineRef = useRef(onDecline);

  useEffect(() => {
    onDeclineRef.current = onDecline;
  });

  useEffect(() => {
    playRingtone(notifications);
    const timeout = window.setTimeout(() => onDeclineRef.current(), RING_TIMEOUT_MS);
    return () => {
      stopRingtone();
      clearTimeout(timeout);
    };
  }, [notifications]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-b from-[#075E54] via-[#0a6b5e] to-[#054940] max-w-md mx-auto">
      <div className="flex flex-col items-center pt-16 pb-4 flex-shrink-0">
        <p className="text-white/70 text-sm font-medium mb-3">Incoming call</p>
        <div className="w-36 h-36 rounded-full bg-[#25D366] flex items-center justify-center text-white text-5xl font-bold shadow-2xl animate-pulse">
          {callerName.charAt(0).toUpperCase() || '?'}
        </div>
        <h2 className="text-white text-2xl font-bold mt-6">{callerName}</h2>
      </div>

      <div className="flex-1" />

      <div className="flex-shrink-0 pb-12 px-6">
        <div className="flex items-center justify-center gap-16">
          <button onClick={onDecline} className="flex flex-col items-center gap-1.5" aria-label="Decline call">
            <div className="w-16 h-16 rounded-full bg-[#E74C3C] flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
              <PhoneOff className="w-7 h-7 text-white" />
            </div>
            <span className="text-white/60 text-[10px] font-semibold">Decline</span>
          </button>

          <button onClick={onAnswer} className="flex flex-col items-center gap-1.5" aria-label="Answer call">
            <div className="w-16 h-16 rounded-full bg-[#25D366] flex items-center justify-center shadow-lg shadow-[#25D366]/30 hover:scale-105 transition-transform">
              <PhoneIncoming className="w-7 h-7 text-white" />
            </div>
            <span className="text-white/60 text-[10px] font-semibold">Answer</span>
          </button>
        </div>
      </div>
    </div>
  );
}
