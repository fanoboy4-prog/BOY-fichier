import { useCallback, useEffect, useState } from 'react';
import type { Contact, CallLogEntry } from '@/lib/contacts';

const CONTACTS_KEY = 'lt_contacts';
const CALLS_KEY = 'lt_call_logs';

function load<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function save<T>(key: string, data: T[]): void {
  try {
    const json = JSON.stringify(data);
    if (localStorage.getItem(key) !== json) localStorage.setItem(key, json);
  } catch {
    // storage may be full or unavailable
  }
}

export function useContacts() {
  const [contacts, setContacts] = useState<Contact[]>(() => load<Contact>(CONTACTS_KEY));

  useEffect(() => { save(CONTACTS_KEY, contacts); }, [contacts]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== CONTACTS_KEY || event.newValue === null) return;
      try {
        setContacts(JSON.parse(event.newValue) as Contact[]);
      } catch {
        // ignore malformed value
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const addContact = useCallback((name: string, phone: string, countryCode: string, requestId?: string) => {
    const contact: Contact = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      name: name.trim(),
      phone: phone.trim(),
      countryCode,
      createdAt: Date.now(),
      ...(requestId ? { requestId } : {}),
    };
    setContacts((prev) => [...prev, contact].sort((a, b) => a.name.localeCompare(b.name)));
    return contact;
  }, []);

  const deleteContact = useCallback((id: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const editContact = useCallback((id: string, name: string, phone: string, countryCode: string) => {
    setContacts((prev) =>
      prev
        .map((c) => (c.id === id ? { ...c, name: name.trim(), phone: phone.trim(), countryCode } : c))
        .sort((a, b) => a.name.localeCompare(b.name)),
    );
  }, []);

  return { contacts, addContact, deleteContact, editContact };
}

export function useCallLogs() {
  const [logs, setLogs] = useState<CallLogEntry[]>(() => load<CallLogEntry>(CALLS_KEY));

  useEffect(() => { save(CALLS_KEY, logs); }, [logs]);

  const addLog = useCallback((entry: Omit<CallLogEntry, 'id'>) => {
    const log: CallLogEntry = {
      ...entry,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    };
    setLogs((prev) => [log, ...prev].slice(0, 50));
  }, []);

  const deleteCallLog = useCallback((id: string) => {
    setLogs((prev) => prev.filter((l) => l.id !== id));
  }, []);

  return { logs, addLog, deleteCallLog };
}
