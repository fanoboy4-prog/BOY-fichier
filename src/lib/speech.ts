export function stopSpeaking(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/**
 * Speak text with guaranteed no-overlap:
 * 1. Cancel any in-progress speech
 * 2. Wait 100ms for cancel to settle
 * 3. Speak the new utterance
 * Resolves when the utterance finishes (or error/cancel).
 */
export function speakTranslation(text: string, lang: string): Promise<void> {
  return new Promise((resolve) => {
    if (!text.trim() || !isSpeechSupported()) {
      resolve();
      return;
    }

    // Always cancel before speaking to prevent overlap
    window.speechSynthesis.cancel();

    setTimeout(() => {
      if (!isSpeechSupported()) {
        resolve();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = 1.0;
      utterance.pitch = 1;

      const voices = window.speechSynthesis.getVoices();
      const langPrefix = lang.split('-')[0];
      const match = voices.find((v) => v.lang === lang) ?? voices.find((v) => v.lang.startsWith(langPrefix));
      if (match) {
        utterance.voice = match;
      }

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      window.speechSynthesis.speak(utterance);
    }, 100);
  });
}
