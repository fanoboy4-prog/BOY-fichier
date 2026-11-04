import { useState, useEffect, useRef, useCallback } from 'react';
import {
  MicOff,
  Mic,
  PhoneOff,
  Video as VideoIcon,
  VideoOff,
  Volume2,
  VolumeX,
  Loader2,
  ChevronDown,
  X,
  PhoneIncoming,
  FlaskConical,
} from 'lucide-react';
import { useVoiceTranslation, ALL_LANGS, findLang } from '@/hooks/useVoiceTranslation';
import { COUNTRY_CODES } from '@/lib/contacts';
import type { Contact } from '@/lib/contacts';
import { playRingtone, stopRingtone, playBusyBeep } from '@/lib/ringtone';
import { sendCallSignal, subscribeCallSignals } from '@/lib/callSignal';
import type { CallSession } from '@/lib/callSignal';
import { getMockTranslation } from '@/lib/mockTranslation';
import { speakTranslation } from '@/lib/speech';

type CallState = 'calling' | 'ringing' | 'connected' | 'no-answer' | 'ended';

interface ShownTranslation {
  original: string;
  translated: string;
  flag: string;
}

interface CallingScreenProps {
  contact: Contact;
  callType: 'voice' | 'video';
  myLang: string;
  targetLang: string;
  onTargetLangChange: (code: string) => void;
  autoTranslate: boolean;
  notifications: { sound: boolean; vibrate: boolean };
  session: CallSession;
  onEnd: (result: { status: 'answered' | 'missed'; duration: number }) => void;
}

function avatarColor(name: string): string {
  const colors = ['#25D366', '#075E54', '#34B7F1', '#E67E22', '#9B59B6', '#E74C3C', '#1ABC9C', '#3498DB'];
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx];
}

function formatDuration(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function CallingScreen({
  contact,
  callType,
  myLang,
  targetLang,
  onTargetLangChange,
  autoTranslate,
  notifications,
  session,
  onEnd,
}: CallingScreenProps) {
  const isCallee = session.kind === 'callee';
  const callId = session.callId;
  const callerName = session.kind === 'caller' ? session.callerName : '';
  const role = isCallee ? 'callee' : 'caller';
  const startedAt = session.kind === 'callee' ? session.startedAt : 0;

  const [callState, setCallState] = useState<CallState>(isCallee ? 'connected' : 'calling');
  const [isVideoOn, setIsVideoOn] = useState(callType === 'video');
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [callSeconds, setCallSeconds] = useState(0);
  const [mockIndex, setMockIndex] = useState(0);
  const [mock, setMock] = useState<ShownTranslation | null>(null);
  const voice = useVoiceTranslation(myLang, targetLang);
  const startVoice = voice.start;

  const country = COUNTRY_CODES.find((c) => c.code === contact.countryCode) ?? COUNTRY_CODES[0];
  const phoneLine = contact.phone ? `${country.flag} ${country.dial} ${contact.phone}` : 'Test call on this device';
  const outputLang = findLang(voice.outputLangCode);

  const stateRef = useRef<CallState>(isCallee ? 'connected' : 'calling');
  const connectTimeRef = useRef<number>(startedAt);
  const peerAckedRef = useRef(false);
  const onEndRef = useRef(onEnd);
  const finishRef = useRef<(notifyPeer: boolean) => void>(() => {});

  const updateState = useCallback((s: CallState) => {
    stateRef.current = s;
    setCallState(s);
  }, []);

  const connectCall = useCallback(() => {
    if (stateRef.current !== 'calling' && stateRef.current !== 'ringing') return;
    stopRingtone();
    connectTimeRef.current = Date.now();
    updateState('connected');
  }, [updateState]);

  const finishCall = (notifyPeer: boolean) => {
    if (stateRef.current === 'no-answer') return;
    const wasConnected = stateRef.current === 'connected';
    stopRingtone();
    voice.stop();
    if (notifyPeer) sendCallSignal({ type: 'end', callId, from: role });
    const duration = wasConnected ? Math.floor((Date.now() - connectTimeRef.current) / 1000) : 0;
    onEnd({ status: wasConnected ? 'answered' : 'missed', duration });
  };

  useEffect(() => {
    onEndRef.current = onEnd;
    finishRef.current = finishCall;
  });

  useEffect(() => {
    if (isCallee) return;
    playRingtone(notifications);
    return () => stopRingtone();
  }, [isCallee, notifications]);

  useEffect(() => {
    if (isCallee) return;
    const timers: number[] = [];
    const later = (fn: () => void, ms: number) => {
      timers.push(window.setTimeout(fn, ms));
    };
    const fail = () => {
      if (stateRef.current !== 'calling' && stateRef.current !== 'ringing') return;
      stopRingtone();
      if (notifications.sound) playBusyBeep();
      updateState('no-answer');
      sendCallSignal({ type: 'end', callId, from: 'caller' });
      later(() => onEndRef.current({ status: 'missed', duration: 0 }), 2000);
    };

    sendCallSignal({ type: 'ring', callId, from: 'caller', name: callerName });
    const unsubscribe = subscribeCallSignals((s) => {
      if (s.callId !== callId || s.from !== 'callee') return;
      if (s.type === 'ack') peerAckedRef.current = true;
      else if (s.type === 'accept') connectCall();
      else if (s.type === 'decline') fail();
      else if (s.type === 'end') finishRef.current(false);
    });

    later(() => {
      if (stateRef.current === 'calling') updateState('ringing');
    }, 2000);

    const answerDelay = 3000 + Math.random() * 5000;
    later(() => {
      if (!peerAckedRef.current) connectCall();
    }, 2000 + answerDelay);

    later(fail, 30000);

    return () => {
      timers.forEach((t) => clearTimeout(t));
      unsubscribe();
    };
  }, [isCallee, callId, callerName, notifications, updateState, connectCall]);

  useEffect(() => {
    if (!isCallee) return;
    return subscribeCallSignals((s) => {
      if (s.callId === callId && s.from === 'caller' && s.type === 'end') finishRef.current(false);
    });
  }, [isCallee, callId]);

  useEffect(() => {
    if (callState !== 'connected') return;
    // Immediately set to 0 so timer shows 00:00 right away
    setCallSeconds(0);
    const startTime = connectTimeRef.current || Date.now();
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setCallSeconds(Number.isNaN(elapsed) ? 0 : elapsed);
    }, 1000);
    return () => clearInterval(interval);
  }, [callState]);

  useEffect(() => {
    if (callState !== 'connected' || !autoTranslate || !voice.supported) return;
    startVoice();
  }, [callState, autoTranslate, voice.supported, startVoice]);

  useEffect(() => {
    if (voice.currentTranslation) setMock(null);
  }, [voice.currentTranslation]);

  const handleEndCall = () => finishCall(true);

  const handleToggleVideo = () => {
    setIsVideoOn((p) => !p);
  };

  const playMockTranslation = () => {
    const { original, translated } = getMockTranslation(mockIndex, outputLang.code);
    setMockIndex((i) => i + 1);
    setMock({ original, translated, flag: outputLang.flag });
    void speakTranslation(translated, outputLang.speech);
  };

  const liveTranslation: ShownTranslation | null =
    voice.currentTranslation && voice.currentTranslation !== '—'
      ? { original: voice.currentOriginal, translated: voice.currentTranslation, flag: voice.currentTargetFlag }
      : null;
  const shownTranslation = mock ?? liveTranslation;

  const isPreCall = callState === 'calling' || callState === 'ringing';
  const isNoAnswer = callState === 'no-answer';

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-b from-[#075E54] via-[#0a6b5e] to-[#054940]">
      {/* Top: Contact info */}
      <div className="flex flex-col items-center pt-12 pb-4 flex-shrink-0">
        {isNoAnswer ? (
          <>
            <p className="text-red-300 text-lg font-bold mb-1">No answer</p>
            <h2 className="text-white text-2xl font-bold mb-1">{contact.name}</h2>
            <p className="text-white/50 text-sm">{phoneLine}</p>
          </>
        ) : callState === 'connected' ? (
          <>
            <p className="text-[#25D366] text-sm font-bold mb-1">
              {formatDuration(callSeconds)} · Translating to {outputLang.label}
            </p>
            <h2 className="text-white text-2xl font-bold mb-1">{contact.name}</h2>
            <p className="text-white/50 text-sm">{phoneLine}</p>
          </>
        ) : (
          <>
            <p className="text-white/70 text-sm font-medium mb-1 flex items-center gap-2">
              {callState === 'ringing' && (
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              )}
              {callState === 'calling' ? 'Calling...' : 'Ringing...'}
            </p>
            <h2 className="text-white text-2xl font-bold mb-1">{contact.name}</h2>
            <p className="text-white/50 text-sm">{phoneLine}</p>
          </>
        )}
      </div>

      {/* Center: Avatar / Video */}
      <div className="flex-1 flex items-center justify-center relative min-h-0">
        {isVideoOn && callState === 'connected' ? (
          <div className="w-full h-full bg-black/30 flex items-center justify-center">
            <div className="text-center">
              <div
                className="w-32 h-32 rounded-full flex items-center justify-center text-white text-5xl font-bold mx-auto mb-4 shadow-2xl"
                style={{ backgroundColor: avatarColor(contact.name) }}
              >
                {contact.name.charAt(0).toUpperCase()}
              </div>
              <p className="text-white/40 text-xs">Video ready — avatar shown</p>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div
              className={`w-36 h-36 rounded-full flex items-center justify-center text-white text-5xl font-bold mx-auto shadow-2xl ${
                isPreCall ? 'animate-pulse' : isNoAnswer ? 'opacity-60' : ''
              }`}
              style={{ backgroundColor: avatarColor(contact.name) }}
            >
              {contact.name.charAt(0).toUpperCase()}
            </div>
          </div>
        )}

        {/* Waveform when listening */}
        {voice.isActive && voice.recognitionStatus === 'recording' && (
          <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-1">
            {Array.from({ length: 16 }).map((_, i) => (
              <span
                key={i}
                className="w-1 rounded-full bg-[#25D366]"
                style={{
                  height: `${4 + Math.abs(Math.sin(i * 0.9)) * 18}px`,
                  animation: `waveform 0.5s ease-in-out ${i * 0.04}s infinite alternate`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Translation box — only when connected */}
      {callState === 'connected' && (
        <div className="px-4 pb-3 flex-shrink-0">
          <div className="rounded-2xl bg-black/30 backdrop-blur-md px-4 py-3 min-h-[100px]">
            {voice.isActive && voice.recognitionStatus === 'recording' && voice.interimText && !voice.currentTranslation && (
              <div className="mb-2">
                <span className="text-white/40 text-[10px] font-bold uppercase">You're saying</span>
                <p className="text-white/60 text-sm italic mt-0.5">{voice.interimText}</p>
              </div>
            )}

            {shownTranslation ? (
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <span className="text-2xl">{shownTranslation.flag}</span>
                  {voice.isSpeaking && <Volume2 className="w-4 h-4 text-[#25D366] animate-pulse" />}
                </div>
                <p className="text-white text-xl font-bold leading-tight">{shownTranslation.translated}</p>
                <p className="text-white/40 text-xs mt-1.5">
                  You: <span className="text-white/60 font-medium">{shownTranslation.original}</span>
                </p>
              </div>
            ) : voice.isTranslating ? (
              <div className="flex items-center justify-center gap-2 py-2">
                <Loader2 className="w-4 h-4 text-[#25D366] animate-spin" />
                <span className="text-white/50 text-sm">Translating...</span>
              </div>
            ) : (
              <div className="text-center py-2">
                <p className="text-white/40 text-sm">
                  {voice.isActive ? 'Speak now...' : 'Tap the mic to start translating'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating language selector — only when connected */}
      {callState === 'connected' && (
        <div className="px-4 pb-2 flex-shrink-0 relative">
          <button
            onClick={() => setShowLangPicker((p) => !p)}
            className="mx-auto flex items-center gap-2 px-4 py-2 rounded-full bg-black/30 backdrop-blur-md text-white text-sm font-semibold hover:bg-black/40 transition-colors"
          >
            <span className="text-base">{outputLang.flag}</span>
            <span>Speak in: {outputLang.label}</span>
            <ChevronDown className="w-4 h-4 text-white/60" />
          </button>

          {showLangPicker && (
            <>
              <div className="fixed inset-0 z-50" onClick={() => setShowLangPicker(false)} />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-[90%] max-w-xs bg-white rounded-2xl shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
                  <span className="text-sm font-bold text-gray-800">Output Language</span>
                  <button onClick={() => setShowLangPicker(false)} className="p-1 text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-2 grid grid-cols-3 gap-1.5 max-h-64 overflow-y-auto">
                  {ALL_LANGS.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => { onTargetLangChange(lang.code); setShowLangPicker(false); }}
                      className={`flex flex-col items-center gap-1 py-2.5 rounded-xl transition-colors ${
                        voice.outputLangCode === lang.code ? 'bg-[#25D366] text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
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
        </div>
      )}

      {callState === 'connected' && (
        <div className="px-4 pb-2 flex-shrink-0 flex justify-center">
          <button
            onClick={playMockTranslation}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white text-[#075E54] text-sm font-semibold shadow-lg hover:scale-[1.02] transition-transform"
          >
            <FlaskConical className="w-4 h-4" />
            Tester seul
          </button>
        </div>
      )}

      {/* Bottom controls */}
      <div className="flex-shrink-0 pb-8 pt-3 px-6">
        {isNoAnswer ? (
          <div className="flex flex-col items-center gap-3">
            <p className="text-white/50 text-sm">Call ended — no answer from {contact.name}</p>
            <button
              onClick={handleEndCall}
              className="w-14 h-14 rounded-full bg-[#E74C3C] text-white flex items-center justify-center hover:bg-[#c0392b] transition-colors shadow-lg"
              aria-label="Close"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
          </div>
        ) : isPreCall ? (
          <div className="flex items-center justify-center gap-8">
            <button
              onClick={connectCall}
              className="flex flex-col items-center gap-1.5"
              aria-label="Simulate answer"
            >
              <div className="w-16 h-16 rounded-full bg-[#25D366] flex items-center justify-center shadow-lg shadow-[#25D366]/30 hover:scale-105 transition-transform">
                <PhoneIncoming className="w-7 h-7 text-white" />
              </div>
              <span className="text-white/60 text-[10px] font-semibold">Answer</span>
            </button>

            <button
              onClick={handleEndCall}
              className="flex flex-col items-center gap-1.5"
              aria-label="Hang up"
            >
              <div className="w-16 h-16 rounded-full bg-[#E74C3C] flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
                <PhoneOff className="w-7 h-7 text-white" />
              </div>
              <span className="text-white/60 text-[10px] font-semibold">Cancel</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={voice.toggleMute}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                voice.isMuted ? 'bg-white text-[#075E54]' : 'bg-white/20 text-white hover:bg-white/30'
              }`}
              aria-label={voice.isMuted ? 'Unmute' : 'Mute'}
            >
              {voice.isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
            </button>

            <button
              onClick={voice.isActive ? voice.stop : voice.start}
              disabled={!voice.supported}
              className={`rounded-full flex items-center justify-center transition-all relative ${
                voice.isActive
                  ? 'bg-[#25D366] text-white scale-110 shadow-lg shadow-[#25D366]/40'
                  : 'bg-[#25D366] text-white hover:scale-105 shadow-lg shadow-[#25D366]/30'
              } disabled:opacity-40`}
              style={{ width: '4.5rem', height: '4.5rem' }}
              aria-label={voice.isActive ? 'Stop translating' : 'Start translating'}
            >
              {voice.isActive ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
              {voice.isActive && (
                <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-30" />
              )}
            </button>

            <button
              onClick={handleToggleVideo}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                isVideoOn ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-white text-[#075E54]'
              }`}
              aria-label={isVideoOn ? 'Turn off video' : 'Turn on video'}
            >
              {isVideoOn ? <VideoIcon className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
            </button>

            <button
              onClick={handleEndCall}
              className="w-14 h-14 rounded-full bg-[#E74C3C] text-white flex items-center justify-center hover:bg-[#c0392b] transition-colors shadow-lg"
              aria-label="End call"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
          </div>
        )}

        {callState === 'connected' && !voice.supported && (
          <p className="text-center text-yellow-300/70 text-xs mt-3">
            Voice recognition needs Chrome. Use the text chat instead.
          </p>
        )}
      </div>
    </div>
  );
}
