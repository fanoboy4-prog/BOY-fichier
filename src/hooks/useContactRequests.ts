import { useCallback, useEffect, useState } from 'react';
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
    setRequests(loadRequests());
    return request;
  }, []);

  const respond = useCallback((id: string, status: RequestStatus) => {
    setRequestStatus(id, status);
    setRequests(loadRequests());
  }, []);

  return { requests, sendRequest, respond };
}
