import { useState, useRef, useEffect, useCallback } from 'react';
import {
  ArrowLeft, Send, Mic, ChevronDown, X, Phone, Video, Reply, Forward, Copy, Languages, Trash2,
} from 'lucide-react';
import type { Contact } from '@/lib/contacts';
import { COUNTRY_CODES } from '@/lib/contacts';
import type { ChatMessage } from '@/lib/chat';
import { appendChatMessage, CHAT_PAIR_PREFIX, loadChatMessages, saveChatMessages, updateChatMessages } from '@/lib/chat';
import { avatarColor } from '@/lib/avatar';
import { translateViaMyMemory } from '@/lib/translateMessage';
import { wallpaperLayerStyle } from '@/lib/appSettings';
import type { Wallpaper } from '@/lib/appSettings';
import { ALL_LANGS, findLang } from '@/lib/languages';
import { ContextMenu } from '@/components/ContextMenu';
import type { ContextMenuItem } from '@/components/ContextMenu';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { ForwardPicker } from '@/components/chat/ForwardPicker';

interface ChatScreenProps {
  contact: Contact;
  contacts: Contact[];
  myLang: string;
  targetLang: string;
  wallpaper: Wallpaper | null;
  onBack: () => void;
  onCall: (contact: Contact, type: 'voice' | 'video') => void;
}

interface ChatPair {
  myLang: string;
  targetLang: string;
}

function loadPair(contactId: string, fallbackMy: string, fallbackTarget: string): ChatPair {
  try {
    const raw = localStorage.getItem(CHAT_PAIR_PREFIX + contactId);
    if (raw) {
      const parsed = JSON.parse(raw) as ChatPair;
      if (parsed.myLang && parsed.targetLang) return parsed;
    }
  } catch {
    // ignore
  }
  return { myLang: fallbackMy, targetLang: fallbackTarget };
}

function savePair(contactId: string, pair: ChatPair): void {
  try {
    localStorage.setItem(CHAT_PAIR_PREFIX + contactId, JSON.stringify(pair));
  } catch {
    // ignore
  }
}

function dayKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function dayLabel(ts: number): string {
  const key = dayKey(ts);
  if (key === dayKey(Date.now())) return "Aujourd'hui";
  if (key === dayKey(Date.now() - 86_400_000)) return 'Hier';
  return new Date(ts).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

interface MenuState {
  msg: ChatMessage;
  x: number;
  y: number;
}

export function ChatScreen({ contact, contacts, myLang, targetLang, wallpaper, onBack, onCall }: ChatScreenProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadChatMessages(contact.id));
  const [input, setInput] = useState('');
  const [translatingIds, setTranslatingIds] = useState<Set<string>>(() => new Set());
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [forwardMsg, setForwardMsg] = useState<ChatMessage | null>(null);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [showVoiceUI, setShowVoiceUI] = useState(false);
  const [interimText, setInterimText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<{ stop: () => void } | null>(null);

  const [pair, setPair] = useState<ChatPair>(() => loadPair(contact.id, myLang, targetLang));
  const myLangOpt = findLang(pair.myLang);
  const targetLangOpt = findLang(pair.targetLang);

  const selectTarget = (code: string) => {
    const next: ChatPair = { myLang: pair.myLang, targetLang: code };
    setPair(next);
    savePair(contact.id, next);
    setShowLangPicker(false);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (!messages.some((m) => m.status === 'delivered')) return;
    const id = window.setTimeout(() => {
      setMessages(updateChatMessages(contact.id, (list) =>
        list.map((m) => (m.status === 'delivered' ? { ...m, status: 'read' } : m))));
    }, 1500);
    return () => window.clearTimeout(id);
  }, [messages, contact.id]);

  const updateMessages = useCallback((updater: (prev: ChatMessage[]) => ChatMessage[]) => {
    setMessages((prev) => {
      const next = updater(prev);
      saveChatMessages(contact.id, next);
      return next;
    });
  }, [contact.id]);

  const runTranslation = useCallback(async (msg: ChatMessage) => {
    setTranslatingIds((prev) => new Set(prev).add(msg.id));
    const translated = await translateViaMyMemory(msg.text, msg.sourceLang, msg.targetLang);
    updateMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, translation: translated } : m)));
    setTranslatingIds((prev) => {
      const next = new Set(prev);
      next.delete(msg.id);
      return next;
    });
  }, [updateMessages]);

  const handleSend = useCallback((overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text) return;

    const sentMsg: ChatMessage = {
      id: newId(),
      text,
      translation: '',
      direction: 'sent',
      sourceLang: myLangOpt.code,
      targetLang: targetLangOpt.code,
      timestamp: Date.now(),
      status: 'sent',
      ...(replyTo ? { replyTo: { text: replyTo.deletedForEveryone ? 'Message supprimé' : replyTo.text } } : {}),
    };

    setInput('');
    setReplyTo(null);
    updateMessages((prev) => [...prev, sentMsg]);
    void runTranslation(sentMsg);
    window.setTimeout(() => {
      setMessages(updateChatMessages(contact.id, (list) =>
        list.map((m) => (m.id === sentMsg.id && m.status === 'sent' ? { ...m, status: 'delivered' } : m))));
    }, 1000);
  }, [input, replyTo, myLangOpt, targetLangOpt, updateMessages, runTranslation, contact.id]);

  // ─── Message actions ──────────────────────────────────────────────────────

  const deleteForMe = (id: string) => {
    updateMessages((prev) => prev.filter((m) => m.id !== id));
  };

  const deleteForEveryone = (id: string) => {
    updateMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, text: '', translation: '', replyTo: undefined, deletedForEveryone: true } : m)),
    );
  };

  const forwardTo = (target: Contact) => {
    if (!forwardMsg) return;
    appendChatMessage(target.id, {
      id: newId(),
      text: forwardMsg.text,
      translation: forwardMsg.translation,
      direction: 'sent',
      sourceLang: forwardMsg.sourceLang,
      targetLang: forwardMsg.targetLang,
      timestamp: Date.now(),
      forwarded: true,
    });
    setForwardMsg(null);
  };

  const menuItems: ContextMenuItem[] = menu ? (
    menu.msg.deletedForEveryone
      ? [{ icon: Trash2, label: 'Supprimer pour moi', color: 'text-red-500', action: () => deleteForMe(menu.msg.id) }]
      : [
        { icon: Trash2, label: 'Supprimer pour moi', color: 'text-red-500', action: () => deleteForMe(menu.msg.id) },
        { icon: Trash2, label: 'Supprimer pour tous', color: 'text-red-500', action: () => deleteForEveryone(menu.msg.id) },
        { icon: Copy, label: 'Copier', action: () => { void navigator.clipboard?.writeText(menu.msg.text).catch(() => {}); } },
        { icon: Languages, label: 'Traduire', action: () => { void runTranslation(menu.msg); } },
        { icon: Reply, label: 'Répondre', action: () => setReplyTo(menu.msg) },
        { icon: Forward, label: 'Transférer', action: () => setForwardMsg(menu.msg) },
      ]
  ) : [];

  // ─── Voice input via Web Speech API ───────────────────────────────────────

  const handleVoiceStart = useCallback(() => {
    setShowVoiceUI(true);
    setInterimText('');

    const w = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionCtor;
      webkitSpeechRecognition?: new () => SpeechRecognitionCtor;
    };
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!SR) return;

    const recognition = new SR();
    recognition.lang = myLangOpt.stt;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalText = '';
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0]?.transcript ?? '';
        if (result.isFinal) finalText += text;
        else interim += text;
      }
      if (interim) setInterimText(interim);
      if (finalText) {
        setShowVoiceUI(false);
        setInterimText('');
        handleSend(finalText);
      }
    };

    recognition.onend = () => {
      setShowVoiceUI(false);
      setInterimText('');
    };

    recognition.onerror = () => {
      setShowVoiceUI(false);
      setInterimText('');
    };

    recognitionRef.current = { stop: () => recognition.abort() };
    try { recognition.start(); } catch { /* already started */ }
  }, [myLangOpt, handleSend]);

  const handleVoiceStop = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setShowVoiceUI(false);
    setInterimText('');
  }, []);

  const country = COUNTRY_CODES.find((c) => c.code === contact.countryCode) ?? COUNTRY_CODES[0];
  const voiceSupported = typeof window !== 'undefined' &&
    !!(window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).SpeechRecognition ||
    !!(window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;
  const otherContacts = contacts.filter((c) => c.id !== contact.id);

  const [viewport, setViewport] = useState<{ top: number; height: number } | null>(() => {
    const vv = window.visualViewport;
    return vv ? { top: vv.offsetTop, height: vv.height } : null;
  });

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => setViewport({ top: vv.offsetTop, height: vv.height });
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);

  return (
    <div
      style={viewport ? { top: viewport.top, height: viewport.height } : undefined}
      className="fixed inset-x-0 top-0 h-[100dvh] z-50 flex flex-col bg-[#E5DDD5] max-w-md mx-auto"
    >
      {/* Header */}
      <div className="flex-shrink-0 h-[60px] bg-[#075E54] px-3 flex items-center gap-3 shadow-md">
        <button onClick={onBack} aria-label="Retour" className="text-white p-1 hover:bg-white/10 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
          style={{ backgroundColor: avatarColor(contact.name) }}
        >
          {contact.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm truncate">{contact.name}</p>
          <p className="text-white/60 text-xs truncate">{country.flag} {country.dial} {contact.phone}</p>
        </div>
        <button
          onClick={() => setShowLangPicker((p) => !p)}
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
        >
          <span className="text-sm">{myLangOpt.flag}</span>
          <span className="text-white/60 text-xs">→</span>
          <span className="text-sm">{targetLangOpt.flag}</span>
          <ChevronDown className="w-3.5 h-3.5 text-white/60" />
        </button>
        <button onClick={() => onCall(contact, 'voice')} aria-label="Appel vocal" className="text-white p-1.5 hover:bg-white/10 rounded-full transition-colors">
          <Phone className="w-5 h-5" />
        </button>
        <button onClick={() => onCall(contact, 'video')} aria-label="Appel vidéo" className="text-white p-1.5 hover:bg-white/10 rounded-full transition-colors">
          <Video className="w-5 h-5" />
        </button>
      </div>

      {/* Language picker dropdown */}
      {showLangPicker && (
        <>
          <div className="fixed inset-0 z-50" onClick={() => setShowLangPicker(false)} />
          <div className="absolute top-14 right-20 z-50 w-[90%] max-w-xs bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
              <span className="text-sm font-bold text-gray-800">Target Language</span>
              <button onClick={() => setShowLangPicker(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-2 grid grid-cols-3 gap-1.5 max-h-64 overflow-y-auto">
              {ALL_LANGS.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => selectTarget(lang.code)}
                  className={`flex flex-col items-center gap-1 py-2.5 rounded-xl transition-colors ${
                    targetLangOpt.code === lang.code ? 'bg-[#25D366] text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-xl">{lang.flag}</span>
                  <span className="text-[10px] font-semibold">{lang.label}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Messages area */}
      <div className="relative flex-1 min-h-0 overflow-hidden">
        {wallpaper && (
          <div aria-hidden className="absolute inset-0 pointer-events-none" style={wallpaperLayerStyle(wallpaper)} />
        )}
        <div ref={scrollRef} className="absolute inset-0 overflow-y-auto px-3 py-3 space-y-1.5">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="bg-yellow-100/80 rounded-lg px-4 py-2 max-w-xs">
                <p className="text-gray-600 text-xs text-center">
                  Messages are translated from {myLangOpt.flag} {myLangOpt.label} to {targetLangOpt.flag} {targetLangOpt.label}. Tap the mic to speak or type below.
                </p>
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={msg.id}>
                {(i === 0 || dayKey(messages[i - 1].timestamp) !== dayKey(msg.timestamp)) && (
                  <div className="flex justify-center my-3">
                    <span className="px-3 py-1 rounded-lg bg-white/90 text-[11px] font-medium text-gray-600 shadow-sm">
                      {dayLabel(msg.timestamp)}
                    </span>
                  </div>
                )}
                <MessageBubble
                  msg={msg}
                  translating={translatingIds.has(msg.id)}
                  highlighted={menu?.msg.id === msg.id}
                  onReply={() => { if (!msg.deletedForEveryone) setReplyTo(msg); }}
                  onOpenMenu={(x, y) => setMenu({ msg, x, y })}
                />
              </div>
            ))
          )}
        </div>
      </div>

      <ContextMenu
        visible={menu !== null}
        x={menu?.x ?? 0}
        y={menu?.y ?? 0}
        items={menuItems}
        onClose={() => setMenu(null)}
      />

      {forwardMsg && (
        <ForwardPicker contacts={otherContacts} onPick={forwardTo} onClose={() => setForwardMsg(null)} />
      )}

      {/* Voice recording overlay */}
      {showVoiceUI && (
        <div className="flex-shrink-0 px-4 py-3 bg-white border-t border-gray-200">
          <div className="flex items-center gap-3">
            <button
              onClick={handleVoiceStop}
              aria-label="Arrêter"
              className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0"
            >
              <Mic className="w-5 h-5 text-white" />
            </button>
            <div className="flex-1 min-h-10 flex items-center">
              {interimText ? (
                <p className="text-gray-700 text-sm italic">{interimText}</p>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-gray-500 text-sm">Listening in {myLangOpt.flag} {myLangOpt.label}...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reply preview and input bar */}
      {!showVoiceUI && (
        <div className="flex-shrink-0 bg-[#F0F2F5]">
          {replyTo && (
            <div className="flex items-center gap-2 mx-2 mt-2 px-3 py-2 rounded-lg bg-white border-l-4 border-[#25D366]">
              <Reply className="w-4 h-4 text-[#075E54] flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-[#075E54]">Répondre</p>
                <p className="text-xs text-gray-600 truncate">{replyTo.deletedForEveryone ? 'Message supprimé' : replyTo.text}</p>
              </div>
              <button onClick={() => setReplyTo(null)} aria-label="Annuler la réponse" className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          <div className="px-2 py-2 flex items-end gap-2">
            <div className="flex-1 bg-white rounded-3xl px-4 py-2 min-h-10 flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
                placeholder={`Type in ${myLangOpt.flag} ${myLangOpt.label}...`}
                className="flex-1 text-sm bg-transparent outline-none text-gray-800 placeholder:text-gray-400"
              />
            </div>
            {input.trim() ? (
              <button
                onClick={() => handleSend()}
                className="w-10 h-10 rounded-full bg-[#075E54] flex items-center justify-center text-white hover:bg-[#064f46] transition-colors flex-shrink-0"
                aria-label="Send"
              >
                <Send className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleVoiceStart}
                disabled={!voiceSupported}
                className="w-10 h-10 rounded-full bg-[#075E54] flex items-center justify-center text-white hover:bg-[#064f46] transition-colors flex-shrink-0 disabled:opacity-40"
                aria-label="Voice input"
              >
                <Mic className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      )}

      {!voiceSupported && !showVoiceUI && (
        <p className="text-center text-gray-500 text-xs pb-2 bg-[#F0F2F5]">
          Voice input needs Chrome. You can still type messages.
        </p>
      )}
    </div>
  );
}

// ─── Web Speech API types ───────────────────────────────────────────────────

interface SpeechRecognitionAlternative { transcript: string; confidence: number; }
interface SpeechRecognitionResult { isFinal: boolean; length: number; [index: number]: SpeechRecognitionAlternative; }
interface SpeechRecognitionResultList { length: number; [index: number]: SpeechRecognitionResult; }
interface SpeechRecognitionEvent extends Event { resultIndex: number; results: SpeechRecognitionResultList; }
interface SpeechRecognitionCtor {
  lang: string; continuous: boolean; interimResults: boolean; maxAlternatives: number;
  start(): void; stop(): void; abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: ((event: Event) => void) | null;
  onstart: ((event: Event) => void) | null;
}
