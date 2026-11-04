export type CallSignalType = 'ring' | 'ack' | 'accept' | 'decline' | 'end';

export interface CallSignal {
  id: string;
  type: CallSignalType;
  callId: string;
  from: 'caller' | 'callee';
  name?: string;
  sentAt: number;
}

export type CallSession =
  | { kind: 'caller'; callId: string; callerName: string }
  | { kind: 'callee'; callId: string; startedAt: number };

const SIGNAL_KEY = 'lt_call_signal';
const MAX_SIGNAL_AGE_MS = 30000;

export function createCallId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function sendCallSignal(signal: Omit<CallSignal, 'id' | 'sentAt'>): void {
  const message: CallSignal = {
    ...signal,
    id: createCallId(),
    sentAt: Date.now(),
  };
  try {
    localStorage.setItem(SIGNAL_KEY, JSON.stringify(message));
  } catch {
    // ignore
  }
}

export function subscribeCallSignals(handler: (signal: CallSignal) => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key !== SIGNAL_KEY || !event.newValue) return;
    let signal: CallSignal;
    try {
      signal = JSON.parse(event.newValue) as CallSignal;
    } catch {
      return;
    }
    if (Date.now() - signal.sentAt > MAX_SIGNAL_AGE_MS) return;
    handler(signal);
  };
  window.addEventListener('storage', onStorage);
  return () => window.removeEventListener('storage', onStorage);
}
