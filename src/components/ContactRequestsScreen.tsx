import { useEffect, useRef, useState } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { Languages, Settings } from 'lucide-react';
import { ContactsTab } from '@/components/ContactsTab';
import { CallsTab } from '@/components/CallsTab';
import { ChatsTab } from '@/components/ChatsTab';
import { TabBar } from '@/components/TabBar';
import { CallingScreen } from '@/components/CallingScreen';
import { IncomingCallScreen } from '@/components/IncomingCallScreen';
import { ChatScreen } from '@/components/ChatScreen';
import { OnboardingScreen } from '@/components/OnboardingScreen';
import { SettingsScreen } from '@/components/settings/SettingsScreen';
import { PaywallScreen } from '@/components/PaywallScreen';
import { ContactRequestsScreen } from '@/components/ContactRequestsScreen';
import { Toast } from '@/components/Toast';
import type { ToastMessage } from '@/components/Toast';
import { useContacts, useCallLogs } from '@/hooks/useContacts';
import { useContactRequests } from '@/hooks/useContactRequests';
import { useLanguageSettings } from '@/hooks/useLanguageSettings';
import { useAppSettings } from '@/hooks/useAppSettings';
import { usePremium } from '@/hooks/usePremium';
import { useBlockedNumbers } from '@/hooks/useBlockedNumbers';
import { findLang } from '@/lib/languages';
import { createCallId, sendCallSignal, subscribeCallSignals } from '@/lib/callSignal';
import type { CallSession } from '@/lib/callSignal';
import { isPeerOnline, loadRequests, touchPresence } from '@/lib/contactRequests';
import type { ContactRequest } from '@/lib/contactRequests';
import { phoneKey } from '@/lib/phoneKey';
import type { Tab, Contact, CallLogEntry } from '@/lib/contacts';

interface ActiveCall { contact: Contact; type: 'voice' | 'video'; session: CallSession; }
interface IncomingCall { callId: string; name: string; }

export default function App() {
  const [tab, setTab] = useState<Tab>('contacts');
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [activeChat, setActiveChat] = useState<Contact | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [editingLanguages, setEditingLanguages] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [paywallDismissed, setPaywallDismissed] = useState(false);
  const [showRequests, setShowRequests] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const busyRef = useRef(false);
  const lastRingIdRef = useRef<string | null>(null);
  const { contacts, addContact, deleteContact, editContact } = useContacts();
  const { logs, addLog, deleteCallLog } = useCallLogs();
  const { settings, isOnboarded, saveSettings } = useLanguageSettings();
  const premium = usePremium();
  const { settings: appSettings, updateSettings, updateProfile, wallpaper, updateWallpaper } = useAppSettings(premium.canUsePremium);
  const { blocked, blockNumber, unblockNumber } = useBlockedNumbers();
  const { requests, sendRequest, respond, cancelRequest } = useContactRequests();
  const profileName = appSettings.profile.name;
  const myKey = phoneKey(appSettings.profile.countryCode, appSettings.profile.phone);
  const [seenRequestIds] = useState(() => new Set(loadRequests().map((r) => r.id)));

  useEffect(() => {
    if (!myKey) return;
    touchPresence(myKey, profileName);
    const id = window.setInterval(() => touchPresence(myKey, profileName), 5000);
    return () => window.clearInterval(id);
  }, [myKey, profileName]);

  useEffect(() => {
    let lastPress = 0;
    const listener = CapacitorApp.addListener('backButton', () => {
      if (showRequests) { setShowRequests(false); return; }
      if (paywallOpen) { setPaywallOpen(false); return; }
      if (editingLanguages) { setEditingLanguages(false); return; }
      if (showSettings) { setShowSettings(false); return; }
      if (activeChat) { setActiveChat(null as any); return; }
      if (activeCall) { setActiveCall(null as any); return; }
      if (incomingCall) { setIncomingCall(null as any); return; }
      if (tab !== 'chats') { setTab('chats' as any); return; }
      const now = Date.now();
      if (now - lastPress < 2000) { CapacitorApp.exitApp(); }
      else { lastPress = now; setToast({ message: 'Appuyez encore pour quitter', type: 'info' } as any); }
    });
    return () => { listener.remove(); };
  }, [activeChat, activeCall, incomingCall, showSettings, editingLanguages, paywallOpen, showRequests, tab]);

  useEffect(() => {
    if (!myKey) return;
    const fresh = requests.filter((r) => r.toKey === myKey && r.status === 'pending' && !seenRequestIds.has(r.id));
    if (fresh.length === 0) return;
    fresh.forEach((r) => seenRequestIds.add(r.id));
    setToast({ title: 'Demande de contact', body: `${fresh[0].fromName} veut vous ajouter.`, actionLabel: 'Voir', onAction: () => setShowRequests(true) });
  }, [requests, myKey, seenRequestIds]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 6000);
    return () => window.clearTimeout(id);
  }, [toast]);

  const pendingIncomingCount = requests.filter((r) => r.toKey === myKey && r.status === 'pending').length;

  const sendContactRequest = (name: string, phone: string, countryCode: string): string | null => {
    if (!myKey) return "Ajoutez votre numéro dans votre profil avant d'envoyer une demande.";
    const toKey = phoneKey(countryCode, phone);
    if (!toKey) return 'Entrez un numéro valide.';
    if (toKey === myKey) return 'Vous ne pouvez pas vous ajouter vous-même.';
    if (requests.some((r) => r.fromKey === myKey && r.toKey === toKey && r.status === 'pending')) {
      return 'Une demande existe déjà pour ce numéro.';
    }
    const request = sendRequest({
      fromKey: myKey, fromName: profileName, fromPhone: appSettings.profile.phone, fromCountryCode: appSettings.profile.countryCode,
      toKey, toName: name.trim(), toPhone: phone.trim(), toCountryCode: countryCode,
    });
    addContact(name, phone, country
