import { useEffect, useRef, useState } from 'react';
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

interface ActiveCall {
  contact: Contact;
  type: 'voice' | 'video';
  session: CallSession;
}

interface IncomingCall {
  callId: string;
  name: string;
}

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
  const {
    settings: appSettings,
    updateSettings,
    updateProfile,
    wallpaper,
    updateWallpaper,
  } = useAppSettings(premium.canUsePremium);
  const { blocked, blockNumber, unblockNumber } = useBlockedNumbers();
  const { requests, sendRequest, respond } = useContactRequests();
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
    if (!myKey) return;
    const fresh = requests.filter(
      (r) => r.toKey === myKey && r.status === 'pending' && !seenRequestIds.has(r.id),
    );
    if (fresh.length === 0) return;
    fresh.forEach((r) => seenRequestIds.add(r.id));
    setToast({
      title: 'Demande de contact',
      body: `${fresh[0].fromName} veut vous ajouter.`,
      actionLabel: 'Voir',
      onAction: () => setShowRequests(true),
    });
  }, [requests, myKey, seenRequestIds]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 6000);
    return () => window.clearTimeout(id);
  }, [toast]);

  const pendingIncomingCount = requests.filter((r) => r.toKey === myKey && r.status === 'pending').length;

  const sendContactRequest = (name: string, phone: string, countryCode: string): string | null => {
    if (!myKey) return 'Ajoutez votre numéro dans votre profil avant d\'envoyer une demande.';
    const toKey = phoneKey(countryCode, phone);
    if (!toKey) return 'Entrez un numéro valide.';
    if (toKey === myKey) return 'Vous ne pouvez pas vous ajouter vous-même.';
    if (requests.some((r) => r.fromKey === myKey && r.toKey === toKey && r.status !== 'declined')) {
      return 'Une demande existe déjà pour ce numéro.';
    }
    const request = sendRequest({
      fromKey: myKey,
      fromName: profileName,
      fromPhone: appSettings.profile.phone,
      fromCountryCode: appSettings.profile.countryCode,
      toKey,
      toName: name.trim(),
      toPhone: phone.trim(),
      toCountryCode: countryCode,
    });
    addContact(name, phone, countryCode, request.id);
    const body = isPeerOnline(toKey)
      ? `${name.trim()} va recevoir votre demande.`
      : `${name.trim()} n'est pas en ligne. Il la verra à sa prochaine ouverture.`;
    setToast({ title: 'Demande envoyée', body });
    return null;
  };

  const acceptRequest = (request: ContactRequest) => {
    respond(request.id, 'accepted');
    const alreadyAdded = contacts.some((c) => phoneKey(c.countryCode, c.phone) === request.fromKey);
    if (!alreadyAdded) addContact(request.fromName, request.fromPhone, request.fromCountryCode, request.id);
  };

  const declineRequest = (request: ContactRequest) => {
    respond(request.id, 'declined');
  };

  useEffect(() => {
    busyRef.current = activeCall !== null || incomingCall !== null;
  }, [activeCall, incomingCall]);

  useEffect(() => {
    return subscribeCallSignals((s) => {
      if (s.from !== 'caller') return;
      if (s.type === 'ring') {
        if (s.callId === lastRingIdRef.current) return;
        lastRingIdRef.current = s.callId;
        if (busyRef.current) {
          sendCallSignal({ type: 'decline', callId: s.callId, from: 'callee' });
          return;
        }
        busyRef.current = true;
        setIncomingCall({ callId: s.callId, name: s.name ?? 'Unknown caller' });
        sendCallSignal({ type: 'ack', callId: s.callId, from: 'callee' });
      } else if (s.type === 'end') {
        setIncomingCall((prev) => (prev?.callId === s.callId ? null : prev));
      }
    });
  }, []);

  const startOutgoingCall = (contact: Contact, type: 'voice' | 'video') => {
    setActiveCall({
      contact,
      type,
      session: { kind: 'caller', callId: createCallId(), callerName: appSettings.profile.name },
    });
  };

  const handleRedial = (entry: CallLogEntry) => {
    const contact = contacts.find((c) => c.id === entry.contactId);
    if (contact) {
      startOutgoingCall(contact, entry.type);
    }
  };

  const answerIncomingCall = () => {
    if (!incomingCall) return;
    const startedAt = Date.now();
    sendCallSignal({ type: 'accept', callId: incomingCall.callId, from: 'callee' });
    setActiveCall({
      contact: {
        id: `call-${incomingCall.callId}`,
        name: incomingCall.name,
        phone: '',
        countryCode: '',
        createdAt: startedAt,
      },
      type: 'voice',
      session: { kind: 'callee', callId: incomingCall.callId, startedAt },
    });
    setIncomingCall(null);
  };

  const declineIncomingCall = () => {
    if (!incomingCall) return;
    sendCallSignal({ type: 'decline', callId: incomingCall.callId, from: 'callee' });
    setIncomingCall(null);
  };

  const handleEndCall = (result: { status: 'answered' | 'missed'; duration: number }) => {
    if (activeCall) {
      const isIncoming = activeCall.session.kind === 'callee';
      addLog({
        contactId: activeCall.contact.id,
        contactName: activeCall.contact.name,
        phone: activeCall.contact.phone,
        type: activeCall.type,
        direction: isIncoming ? 'incoming' : 'outgoing',
        status: result.status === 'answered' ? (isIncoming ? 'incoming' : 'outgoing') : 'missed',
        duration: result.duration,
        timestamp: Date.now(),
      });
    }
    setActiveCall(null);
    if (result.status === 'missed') {
      setTab('calls');
    }
  };

  if (!isOnboarded || editingLanguages) {
    return (
      <OnboardingScreen
        initialMyLang={settings?.myLang}
        initialTargetLang={settings?.targetLang}
        isSettings={isOnboarded}
        onComplete={(myLang, targetLang) => {
          saveSettings(myLang, targetLang);
          setEditingLanguages(false);
        }}
      />
    );
  }

  if (incomingCall) {
    return (
      <IncomingCallScreen
        callerName={incomingCall.name}
        notifications={appSettings.notifications}
        onAnswer={answerIncomingCall}
        onDecline={declineIncomingCall}
      />
    );
  }

  const showPaywall = paywallOpen || (premium.status === 'expired' && !paywallDismissed);
  const premiumLabel =
    premium.status === 'premium'
      ? 'Active'
      : premium.status === 'trial'
        ? `Free trial: ${premium.daysLeft} days left`
        : 'Trial ended, unlock to continue';

  if (showPaywall) {
    return (
      <PaywallScreen
        status={premium.status}
        daysLeft={premium.daysLeft}
        onActivate={premium.activatePremium}
        onClose={() => {
          setPaywallOpen(false);
          setPaywallDismissed(true);
        }}
      />
    );
  }

  if (showSettings) {
    return (
      <SettingsScreen
        onClose={() => setShowSettings(false)}
        onEditLanguages={() => {
          setShowSettings(false);
          setEditingLanguages(true);
        }}
        settings={appSettings}
        updateSettings={updateSettings}
        updateProfile={updateProfile}
        wallpaper={wallpaper}
        updateWallpaper={updateWallpaper}
        blocked={blocked}
        unblockNumber={unblockNumber}
        premiumLabel={premiumLabel}
        canUsePremium={premium.canUsePremium}
        onOpenPaywall={() => setPaywallOpen(true)}
      />
    );
  }

  if (showRequests) {
    return (
      <ContactRequestsScreen
        requests={requests}
        myKey={myKey}
        onAccept={acceptRequest}
        onDecline={declineRequest}
        onBack={() => setShowRequests(false)}
      />
    );
  }

  if (activeCall && settings) {
    return (
      <CallingScreen
        contact={activeCall.contact}
        callType={activeCall.type}
        myLang={settings.myLang}
        targetLang={settings.targetLang}
        onTargetLangChange={(code) => saveSettings(settings.myLang, code)}
        autoTranslate={appSettings.calls.autoTranslate}
        notifications={appSettings.notifications}
        session={activeCall.session}
        onEnd={handleEndCall}
      />
    );
  }

  if (activeChat && settings) {
    return (
      <ChatScreen
        contact={activeChat}
        contacts={contacts}
        myLang={settings.myLang}
        targetLang={settings.targetLang}
        wallpaper={premium.canUsePremium ? wallpaper : null}
        onBack={() => setActiveChat(null)}
        onCall={startOutgoingCall}
      />
    );
  }

  const myLangOpt = findLang(settings!.myLang);
  const targetLangOpt = findLang(settings!.targetLang);

  return (
    <div className="h-[100dvh] flex flex-col bg-white max-w-md mx-auto shadow-2xl">
      {/* Header */}
      <div className="flex-shrink-0 bg-[#075E54] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Languages className="w-6 h-6 text-white" />
          <h1 className="text-white text-xl font-bold">
            LIVE <span className="text-[#25D366]">TRANSLATION</span>
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setEditingLanguages(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            aria-label="Language settings"
          >
            <span className="text-base">{myLangOpt.flag}</span>
            <span className="text-white/60 text-xs">→</span>
            <span className="text-base">{targetLangOpt.flag}</span>
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="text-white/80 hover:text-white transition-colors"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-0">
        {tab === 'contacts' && (
          <ContactsTab
            contacts={contacts}
            requests={requests}
            pendingIncomingCount={pendingIncomingCount}
            onAdd={sendContactRequest}
            onOpenRequests={() => setShowRequests(true)}
            onDelete={deleteContact}
            onEdit={editContact}
            onCall={startOutgoingCall}
            onBlock={blockNumber}
          />
        )}
        {tab === 'calls' && <CallsTab logs={logs} onCall={handleRedial} onDelete={deleteCallLog} />}
        {tab === 'chats' && <ChatsTab contacts={contacts} onOpenChat={(c) => setActiveChat(c)} onBlock={blockNumber} />}
      </div>

      {/* Tab bar */}
      <TabBar active={tab} onChange={setTab} />
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}
