import { useCallback, useEffect, useRef, useState } from 'react';
import { translateText } from '@/lib/translate';
import { speakTranslation, stopSpeaking, isSpeechSupported } from '@/lib/speech';
import { ALL_LANGS, findLang } from '@/lib/languages';
import { lookupDictionary } from '@/lib/mgDictionary';
import type { LangOption } from '@/lib/languages';

export { ALL_LANGS, findLang };
export type { LangOption };

export interface VoiceEntry {
  id: number;
  original: string;
  translated: string;
  targetLang: string;
  targetFlag: string;
  timestamp: number;
}

// ─── Types for Web Speech API ────────────────────────────────────────────────

type RecognitionStatus = 'idle' | 'recording' | 'processing';

interface SpeechRecognitionAlternative { transcript: string; confidence: number; }
interface SpeechRecognitionResult { isFinal: boolean; length: number; [index: number]: SpeechRecognitionAlternative; }
interface SpeechRecognitionResultList { length: number; [index: number]: SpeechRecognitionResult; }
interface SpeechRecognitionEvent extends Event { resultIndex: number; results: SpeechRecognitionResultList; }
interface SpeechRecognitionErrorEvent extends Event { error: string; message: string; }
interface SpeechRecognition extends EventTarget {
  lang: string; continuous: boolean; interimResults: boolean; maxAlternatives: number;
  start(): void; stop(): void; abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((event: Event) => void) | null;
  onstart: ((event: Event) => void) | null;
}
interface SpeechRecognitionConstructor { new (): SpeechRecognition; }

function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

// ─── Translation helpers ────────────────────────────────────────────────────

async function translateViaMyMemory(text: string, source: string, target: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${source}|${target}`,
    );
    if (!res.ok) return null;
    const data = await res.json();
    return (data?.responseData?.translatedText as string) ?? null;
  } catch {
    return null;
  }
}

async function doTranslate(text: string, sourceCode: string, target: LangOption): Promise<string> {
  const trimmed = text.trim().toLowerCase();
  const targetCode = target.code;

  // 2. Existing dictionary / edge function (supports mg → fr, zh)
  if (sourceCode === 'mg' && (targetCode === 'fr' || targetCode === 'zh')) {
    try {
      const results = await translateText(trimmed, 'mg', [targetCode]);
      if (results[targetCode]) return results[targetCode];
    } catch { /* fall through */ }
  }

  // 3. MyMemory direct (source → target)
  const direct = await translateViaMyMemory(trimmed, sourceCode, targetCode);
  if (direct) return direct;

  const fromDictionary = lookupDictionary(trimmed, sourceCode, targetCode);
  if (fromDictionary) return fromDictionary;

  // 4. MyMemory via English pivot (source → en → target)
  if (sourceCode !== 'en' && targetCode !== 'en') {
    const enText = await translateViaMyMemory(trimmed, sourceCode, 'en');
    if (enText) {
      const pivoted = await translateViaMyMemory(enText, 'en', targetCode);
      if (pivoted) return pivoted;
    }
  }

  return '';
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useVoiceTranslation(initialInput: string, initialOutput: string) {
  const [isActive, setIsActive] = useState(false);
  const [recognitionStatus, setRecognitionStatus] = useState<RecognitionStatus>('idle');
  const [interimText, setInterimText] = useState('');
  const [currentOriginal, setCurrentOriginal] = useState('');
  const [currentTranslation, setCurrentTranslation] = useState('');
  const [currentTargetFlag, setCurrentTargetFlag] = useState(
    findLang(initialOutput)?.flag ?? '🏳️',
  );
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [history, setHistory] = useState<VoiceEntry[]>([]);
  const [inputLangCode, setInputLangCode] = useState(initialInput);
  const [outputLangCode, setOutputLangCode] = useState(initialOutput);
  const [supported] = useState(() => !!getSpeechRecognition());
  const [ttsSupported] = useState(() => isSpeechSupported());

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const entryIdRef = useRef(0);
  const finalTextRef = useRef('');
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isActiveRef = useRef(false);
  const isMutedRef = useRef(false);
  const inputLangRef = useRef(initialInput);
  const outputLangRef = useRef(initialOutput);
  const speakingRef = useRef(false);

  useEffect(() => { inputLangRef.current = inputLangCode; }, [inputLangCode]);
  useEffect(() => { outputLangRef.current = outputLangCode; }, [outputLangCode]);
  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);

  const clearDebounce = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }, []);

  const processFinalText = useCallback(async () => {
    const text = finalTextRef.current.trim();
    if (!text || !isActiveRef.current) return;

    finalTextRef.current = '';
    setIsTranslating(true);
    setCurrentOriginal(text);
    setCurrentTranslation('');

    const target = findLang(outputLangRef.current);
    const sourceCode = inputLangRef.current;
    const translated = await doTranslate(text, sourceCode, target);

    if (!isActiveRef.current) return;

    setCurrentTranslation(translated || '—');
    setCurrentTargetFlag(target.flag);

    const entry: VoiceEntry = {
      id: entryIdRef.current++,
      original: text,
      translated: translated || '—',
      targetLang: target.code,
      targetFlag: target.flag,
      timestamp: Date.now(),
    };
    setHistory((prev) => [entry, ...prev].slice(0, 30));
    setIsTranslating(false);

    if (translated && translated !== '—' && !isMutedRef.current && ttsSupported) {
      speakingRef.current = true;
      setIsSpeaking(true);
      try {
        await speakTranslation(translated, target.speech);
      } catch {
        // TTS error — ignore
      }
      speakingRef.current = false;
      setIsSpeaking(false);
    }
  }, [ttsSupported]);

  const startRecognition = useCallback(() => {
    const SR = getSpeechRecognition();
    if (!SR || !isActiveRef.current) return;

    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch { /* ignore */ }
      recognitionRef.current = null;
    }

    const inputLang = findLang(inputLangRef.current);
    const recognition = new SR();
    recognition.lang = inputLang.stt;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    let fellBack = false;

    const handleResult = (event: SpeechRecognitionEvent) => {
      let finalChunk = '';
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0]?.transcript ?? '';
        if (result.isFinal) finalChunk += text;
        else interim += text;
      }
      if (finalChunk) {
        finalTextRef.current = (finalTextRef.current + ' ' + finalChunk).trim();
        clearDebounce();
        debounceTimerRef.current = setTimeout(() => {
          if (isActiveRef.current) processFinalText();
        }, 500);
      }
      setInterimText(interim);
    };

    const handleEnd = () => {
      setRecognitionStatus('idle');
      setInterimText('');
      if (isActiveRef.current && !speakingRef.current) {
        setTimeout(() => {
          if (isActiveRef.current && !speakingRef.current) startRecognition();
        }, 300);
      }
    };

    const handleError = (event: SpeechRecognitionErrorEvent) => {
      if ((event.error === 'language-not-supported' || event.error === 'service-not-allowed') && !fellBack) {
        fellBack = true;
        try { recognition.abort(); } catch { /* ignore */ }
        const fallback = new SR();
        // Fallback: try en-US as universal fallback
        fallback.lang = inputLang.code === 'mg' ? 'fr-FR' : 'en-US';
        fallback.continuous = true;
        fallback.interimResults = true;
        fallback.maxAlternatives = 1;
        fallback.onstart = () => setRecognitionStatus('recording');
        fallback.onresult = handleResult;
        fallback.onerror = () => setRecognitionStatus('idle');
        fallback.onend = handleEnd;
        recognitionRef.current = fallback;
        try { fallback.start(); } catch { /* ignore */ }
        return;
      }
      if (event.error === 'no-speech' || event.error === 'aborted') return;
      setRecognitionStatus('idle');
    };

    recognition.onstart = () => setRecognitionStatus('recording');
    recognition.onresult = handleResult;
    recognition.onerror = handleError;
    recognition.onend = handleEnd;

    recognitionRef.current = recognition;
    try { recognition.start(); } catch { /* already started */ }
  }, [clearDebounce, processFinalText]);

  const start = useCallback(() => {
    if (isActiveRef.current) return;
    isActiveRef.current = true;
    setIsActive(true);
    finalTextRef.current = '';
    setInterimText('');
    setCurrentOriginal('');
    setCurrentTranslation('');
    setHistory([]);
    startRecognition();
  }, [startRecognition]);

  const stop = useCallback(() => {
    isActiveRef.current = false;
    setIsActive(false);
    clearDebounce();
    speakingRef.current = false;
    setIsSpeaking(false);
    stopSpeaking();
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch { /* ignore */ }
      recognitionRef.current = null;
    }
    setRecognitionStatus('idle');
    setInterimText('');
  }, [clearDebounce]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      if (next) {
        stopSpeaking();
        speakingRef.current = false;
        setIsSpeaking(false);
      }
      return next;
    });
  }, []);

  useEffect(() => {
    return () => {
      isActiveRef.current = false;
      clearDebounce();
      stopSpeaking();
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch { /* ignore */ }
      }
    };
  }, [clearDebounce]);

  return {
    isActive,
    recognitionStatus,
    interimText,
    currentOriginal,
    currentTranslation,
    currentTargetFlag,
    isSpeaking,
    isTranslating,
    isMuted,
    history,
    inputLangCode,
    outputLangCode,
    supported,
    ttsSupported,
    start,
    stop,
    toggleMute,
    setInputLangCode,
    setOutputLangCode,
  };
}
