import { lookupDictionary } from '@/lib/mgDictionary';

/**
 * Translate text using MyMemory API (free, no key required).
 * Falls back to a Malagasy/French dictionary, then an English pivot.
 */
export async function translateViaMyMemory(
  text: string,
  source: string,
  target: string,
): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed) return '';
  if (source === target) return trimmed;

  const direct = await fetchDirect(trimmed, source, target);
  if (direct) return direct;

  const fromDictionary = lookupDictionary(trimmed, source, target);
  if (fromDictionary) return fromDictionary;

  // Pivot through English
  if (source !== 'en' && target !== 'en') {
    const enText = await fetchDirect(trimmed, source, 'en');
    if (enText) {
      const pivoted = await fetchDirect(enText, 'en', target);
      if (pivoted) return pivoted;
    }
  }

  return '';
}

async function fetchDirect(text: string, source: string, target: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${source}|${target}`,
    );
    if (!res.ok) return null;
    const data = await res.json();
    const translated = data?.responseData?.translatedText as string | undefined;
    if (!translated) return null;
    // MyMemory sometimes returns warnings or quota messages in translatedText
    if (translated.startsWith('PLEASE SELECT') || translated.includes('MYMEMORY WARNING')) return null;
    if (translated.trim().toLowerCase() === text.trim().toLowerCase()) return null;
    return translated;
  } catch {
    return null;
  }
}
