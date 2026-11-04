export type MessageStatus = 'sent' | 'delivered' | 'read';

export interface ChatMessage {
  id: string;
  text: string;
  translation: string;
  direction: 'sent' | 'received';
  sourceLang: string;
  targetLang: string;
  timestamp: number;
  status?: MessageStatus;
  replyTo?: { text: string };
  forwarded?: boolean;
  deletedForEveryone?: boolean;
}

const CHAT_PREFIX = 'lt_chat_';
export const CHAT_PAIR_PREFIX = 'lt_chat_pair_';

export function loadChatMessages(contactId: string): ChatMessage[] {
  try {
    const raw = localStorage.getItem(CHAT_PREFIX + contactId);
    return raw ? (JSON.parse(raw) as ChatMessage[]).filter((m) => m.direction === 'sent') : [];
  } catch {
    return [];
  }
}

export function saveChatMessages(contactId: string, messages: ChatMessage[]): void {
  try {
    localStorage.setItem(CHAT_PREFIX + contactId, JSON.stringify(messages));
  } catch {
    // storage may be full or unavailable
  }
}

export function updateChatMessages(
  contactId: string,
  updater: (messages: ChatMessage[]) => ChatMessage[],
): ChatMessage[] {
  const next = updater(loadChatMessages(contactId));
  saveChatMessages(contactId, next);
  return next;
}

export function appendChatMessage(contactId: string, message: ChatMessage): void {
  saveChatMessages(contactId, [...loadChatMessages(contactId), message]);
}

export function deleteChatHistory(contactId: string): void {
  try {
    localStorage.removeItem(CHAT_PREFIX + contactId);
    localStorage.removeItem(CHAT_PAIR_PREFIX + contactId);
  } catch {
    // ignore
  }
}

export function getLastMessage(contactId: string): ChatMessage | null {
  const msgs = loadChatMessages(contactId);
  return msgs.length > 0 ? msgs[msgs.length - 1] : null;
}

export function formatClockTime(ts: number): string {
  const d = new Date(ts);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}
