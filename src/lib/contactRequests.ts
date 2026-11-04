export type RequestStatus = 'pending' | 'accepted' | 'declined';

export interface NewContactRequest {
  fromKey: string;
  fromName: string;
  fromPhone: string;
  fromCountryCode: string;
  toKey: string;
  toName: string;
  toPhone: string;
  toCountryCode: string;
}

export interface ContactRequest extends NewContactRequest {
  id: string;
  status: RequestStatus;
  createdAt: number;
  updatedAt: number;
}

export const REQUEST_STATUS_LABEL: Record<RequestStatus, string> = {
  pending: 'En attente',
  accepted: 'Accepté',
  declined: 'Refusé',
};

const REQUESTS_KEY = 'lt_contact_requests';
const PRESENCE_KEY = 'lt_presence';
const PRESENCE_TTL_MS = 15000;

type Presence = Record<string, { name: string; lastSeen: number }>;

function readRaw(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeRaw(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // storage may be full or unavailable
  }
}

function parseRequests(raw: string | null): ContactRequest[] {
  if (!raw) return [];
  try {
    return JSON.parse(raw) as ContactRequest[];
  } catch {
    return [];
  }
}

function parsePresence(raw: string | null): Presence {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Presence;
  } catch {
    return {};
  }
}

export function loadRequests(): ContactRequest[] {
  return parseRequests(readRaw(REQUESTS_KEY));
}

export function subscribeRequests(handler: (requests: ContactRequest[]) => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === REQUESTS_KEY) handler(parseRequests(event.newValue));
  };
  window.addEventListener('storage', onStorage);
  return () => window.removeEventListener('storage', onStorage);
}

export function createRequest(input: NewContactRequest): ContactRequest {
  const now = Date.now();
  const request: ContactRequest = {
    ...input,
    id: `${now}-${Math.random().toString(36).slice(2, 9)}`,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  };
  writeRaw(REQUESTS_KEY, JSON.stringify([request, ...loadRequests()]));
  return request;
}

export function setRequestStatus(id: string, status: RequestStatus): void {
  const next = loadRequests().map((r) => (r.id === id ? { ...r, status, updatedAt: Date.now() } : r));
  writeRaw(REQUESTS_KEY, JSON.stringify(next));
}

export function touchPresence(key: string, name: string): void {
  const now = Date.now();
  const presence = parsePresence(readRaw(PRESENCE_KEY));
  for (const other of Object.keys(presence)) {
    if (now - presence[other].lastSeen > PRESENCE_TTL_MS) delete presence[other];
  }
  presence[key] = { name, lastSeen: now };
  writeRaw(PRESENCE_KEY, JSON.stringify(presence));
}

export function isPeerOnline(key: string): boolean {
  const entry = parsePresence(readRaw(PRESENCE_KEY))[key];
  return entry !== undefined && Date.now() - entry.lastSeen <= PRESENCE_TTL_MS;
}
