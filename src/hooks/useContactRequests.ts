import { useEffect, useState, useCallback } from 'react';
import { loadRequests, saveRequest, updateRequestStatus, cancelRequestById, updateInvitationMessage } from '@/lib/contactRequests';
import type { ContactRequest, RequestStatus } from '@/lib/contactRequests';

export function useContactRequests() {
  const [requests, setRequests] = useState<ContactRequest[]>(() => loadRequests());
  const refresh = useCallback(() => setRequests(loadRequests()), []);
  useEffect(() => {
    window.addEventListener('requests-changed', refresh);
    window.addEventListener('storage', refresh);
    const id = setInterval(refresh, 2000);
    return () => { window.removeEventListener('requests-changed', refresh); window.removeEventListener('storage', refresh); clearInterval(id); };
  }, [refresh]);

  const sendRequest = (data: Omit<ContactRequest, 'id' | 'status' | 'createdAt'>) => {
    const r: ContactRequest = { ...data, id: `req-${Date.now()}-${Math.random().toString(36).slice(2,7)}`, status: 'pending', createdAt: Date.now() };
    saveRequest(r); refresh(); return r;
  };
  const respond = (id: string, status: RequestStatus) => { updateRequestStatus(id, status); refresh(); };
  const cancelRequest = (id: string) => { cancelRequestById(id); refresh(); };
  const sendInvitationMessage = (id: string, msg: string) => { updateInvitationMessage(id, msg); refresh(); };

  return { requests, sendRequest, respond, cancelRequest, sendInvitationMessage, refresh };
}
