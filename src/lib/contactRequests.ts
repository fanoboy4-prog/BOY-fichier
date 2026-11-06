export type RequestStatus = 'pending' | 'accepted' | 'declined' | 'cancelled';

export interface ContactRequest {
  id: string;
  fromKey: string;
  fromName: string;
  fromPhone: string;
  fromCountryCode: string;
  toKey: string;
  toName: string;
  toPhone: string;
  toCountryCode: string;
  status: RequestStatus;
  invitationMessage?: string;
  createdAt: number;
}

// --- ITO NO TSY HITA TEO - AVERIKO ---
export const REQUEST_STATUS_LABEL: Record<RequestStatus, string> = {
  pending: 'En attente',
  accepted: 'Acceptée',
  declined: 'Refusée',
  cancelled: 'Annulée',
};
export const REQUEST_STATUS_LABELS = REQUEST_STATUS_LABEL;

const KEY = 'live-translation-requests';
const PRESENCE_KEY = 'live-translation-presence';

export function loadRequests(): ContactRequest[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}
function saveRequests(list: ContactRequest[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event('requests-changed'));
}
export function saveRequest(r: ContactRequest) {
  const list = loadRequests();
  list.push(r);
  saveRequests(list);
  return r;
}
export function updateRequestStatus(id: string, status: RequestStatus) {
  const list = loadRequests().map(r => r.id === id ? { ...r, status } : r);
  saveRequests(list);
}
export function cancelRequestById(id: string) {
  updateRequestStatus(id, 'cancelled');
}
export function updateInvitationMessage(id: string, msg: string) {
  const list = loadRequests().map(r => r.id === id ? { ...r, invitationMessage: msg } : r);
  saveRequests(list);
}
export function touchPresence(myKey: string, name: string) {
  try {
    const all = JSON.parse(localStorage.getItem(PRESENCE_KEY) || '{}');
    all[myKey] = { name, lastSeen: Date.now() };
    localStorage.setItem(PRESENCE_KEY, JSON.stringify(all));
  } catch {}
}
export function isPeerOnline(key: string) {
  try {
    const all = JSON.parse(localStorage.getItem(PRESENCE_KEY) || '{}');
    return all[key] && Date.now() - all[key].lastSeen < 15000;
  } catch { return false; }
      }
