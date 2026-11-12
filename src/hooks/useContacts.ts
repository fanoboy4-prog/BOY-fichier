import { useCallback, useEffect, useState } from 'react';
import type { Contact, CallLogEntry } from '@/lib/contacts';
import { supabase } from '../lib/supabase';

const CONTACTS_KEY = 'lt_contacts';
const CALLS_KEY = 'lt_call_logs';

function load<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch { return []; }
}
function save<T>(key: string, data: T[]): void {
  try {
    const json = JSON.stringify(data);
    if (localStorage.getItem(key) !== json) localStorage.setItem(key, json);
  } catch {}
}

export function useContacts() {
  const [contacts, setContacts] = useState<Contact[]>(() => load<Contact>(CONTACTS_KEY));

  useEffect(() => { save(CONTACTS_KEY, contacts); }, [contacts]);

  // 1. LECTURE @ SUPABASE @ FANOMBOHANA + REALTIME
  useEffect(() => {
    // Maka ny contacts efa ao @ Supabase
    supabase.from('contacts').select('*').then(({ data, error }) => {
      if (error) { console.log('Supabase read error:', error.message); return; }
      if (data && data.length > 0) {
        const mapped: Contact[] = data.map((r: any) => ({
          id: r.id,
          name: r.name,
          phone: r.phone,
          countryCode: r.country_code,
          createdAt: r.created_at,
        }));
        setContacts(mapped.sort((a,b) => a.name.localeCompare(b.name)));
      }
    });

    // Realtime - rehefa misy olona manampy contact, tonga ho azy!
    const channel = supabase.channel('contacts-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contacts' }, (payload) => {
        if (payload.eventType === 'INSERT' && payload.new) {
          const n: any = payload.new;
          const c: Contact = { id: n.id, name: n.name, phone: n.phone, countryCode: n.country_code, createdAt: n.created_at };
          setContacts((prev) => {
            if (prev.some(x => x.id === c.id)) return prev;
            return [...prev, c].sort((a,b) => a.name.localeCompare(b.name));
          });
        }
        if (payload.eventType === 'DELETE' && payload.old) {
          setContacts((prev) => prev.filter(x => x.id !== (payload.old as any).id));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
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
    // Mandefa @ Supabase - ARY MIJERY ERREUR IZAO!
    supabase.from('contacts').insert({
      id: contact.id,
      name: contact.name,
      phone: contact.phone,
      country_code: contact.countryCode,
      created_at: contact.createdAt
    }).then(({ error }) => {
      if (error) console.log('Supabase insert error:', error.message);
      else console.log('Contact envoyé @ Supabase OK!');
    });
    return contact;
  }, []);

  const deleteContact = useCallback((id: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== id));
    supabase.from('contacts').delete().eq('id', id).then(()=>{});
  }, []);

  const editContact = useCallback((id: string, name: string, phone: string, countryCode: string) => {
    setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, name: name.trim(), phone: phone.trim(), countryCode } : c)).sort((a, b) => a.name.localeCompare(b.name)));
    supabase.from('contacts').update({ name: name.trim(), phone: phone.trim(), country_code: countryCode }).eq('id', id).then(()=>{});
  }, []);

  return { contacts, addContact, deleteContact, editContact };
}

export function useCallLogs() {
  const [logs, setLogs] = useState<CallLogEntry[]>(() => load<CallLogEntry>(CALLS_KEY));
  useEffect(() => { save(CALLS_KEY, logs); }, [logs]);
  const addLog = useCallback((entry: Omit<CallLogEntry, 'id'>) => {
    const log: CallLogEntry = { ...entry, id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}` };
    setLogs((prev) => [log, ...prev].slice(0, 50));
  }, []);
  const deleteCallLog = useCallback((id: string) => {
    setLogs((prev) => prev.filter((l) => l.id !== id));
  }, []);
  return { logs, addLog, deleteCallLog };
      }
