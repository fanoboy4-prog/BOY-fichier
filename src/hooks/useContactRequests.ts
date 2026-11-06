import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  createRequest,
  loadRequests,
  setRequestStatus,
  subscribeRequests,
} from '@/lib/contactRequests';
import type { ContactRequest, NewContactRequest, RequestStatus } from '@/lib/contactRequests';

export function useContactRequests() {
  const [requests, setRequests] = useState<ContactRequest[]>(() => loadRequests());

  useEffect(() => subscribeRequests(setRequests), []);

  const sendRequest = useCallback((input: NewContactRequest) => {
    const request = createRequest(input);
    supabase.from('contact_requests').insert({ id: request.id, from_name: (request as any).fromName, from_phone: (request as any).fromPhone, to_name: (request as any).toName, to_phone: (request as any).toPhone, status: (request as any).status, created_at: (request as any).createdAt }).then(() => {});
    setRequests(loadRequests());
    return request;
  }, []);

  const respond = useCallback((id: string, status: RequestStatus) => {
    setRequestStatus(id, status);
    setRequests(loadRequests());
  }, []);

  return { requests, sendRequest, respond };
}
