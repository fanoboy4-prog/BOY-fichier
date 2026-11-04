type Entry = readonly [string, string];

const ENTRIES: Entry[] = [
  ['manao ahoana', 'bonjour'],
  ['salama', 'bonjour'],
  ['manahoana', 'comment ça va'],
  ['tsara aho', 'je vais bien'],
  ['tsara tokoa', 'très bien'],
  ['misaotra betsaka', 'merci beaucoup'],
  ['misaotra anao', 'merci à toi'],
  ['misaotra', 'merci'],
  ['veloma', 'au revoir'],
  ['azafady', "s'il vous plaît"],
  ['miala tsiny', 'pardon'],
  ['tsy mahazo', 'je ne comprends pas'],
  ['mahazo', 'je comprends'],
  ['inona ny anaranao', "comment tu t'appelles"],
  ['eny', 'oui'],
  ['tsia', 'non'],
  ['tsara', 'bien'],
  ['ratsy', 'mauvais'],
  ['aho', 'je'],
  ['ianao', 'tu'],
  ['izy', 'il'],
  ['izy ireo', 'ils'],
  ['isika', 'nous'],
  ['ianareo', 'vous'],
  ['anarana', 'nom'],
  ['aiza', 'où'],
  ['inona', 'quoi'],
  ['iza', 'qui'],
  ['oviana', 'quand'],
  ['mandeha', 'aller'],
  ['miteny', 'parler'],
  ['mihinana', 'manger'],
  ['matory', 'dormir'],
  ['tia', 'aimer'],
  ['vola', 'argent'],
  ['trano', 'maison'],
  ['lalana', 'route'],
  ['tanana', 'main'],
  ['rano', 'eau'],
  ['sakafo', 'nourriture'],
  ['lehilahy', 'homme'],
  ['vehivavy', 'femme'],
  ['zaza', 'enfant'],
  ['havana', 'famille'],
  ['fitiavana', 'amour'],
  ['maraina', 'matin'],
  ['alina', 'nuit'],
  ['androany', "aujourd'hui"],
  ['rahampitso', 'demain'],
  ['omaly', 'hier'],
  ['ny', 'le'],
  ['sy', 'et'],
  ['ary', 'et'],
  ['fa', 'mais'],
];

interface DictionaryTables {
  phrases: Map<string, string>;
  words: Map<string, string>;
}

function buildTables(pairs: Entry[]): DictionaryTables {
  const phrases = new Map<string, string>();
  const words = new Map<string, string>();
  for (const [source, target] of pairs) {
    const map = source.includes(' ') ? phrases : words;
    if (!map.has(source)) map.set(source, target);
  }
  return { phrases, words };
}

const MG_TO_FR = buildTables(ENTRIES);
const FR_TO_MG = buildTables(ENTRIES.map(([mg, fr]): Entry => [fr, mg]));

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/’/g, "'")
    .replace(/[.,!?;:"«»()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function lookupDictionary(text: string, source: string, target: string): string | null {
  const tables =
    source === 'mg' && target === 'fr' ? MG_TO_FR :
    source === 'fr' && target === 'mg' ? FR_TO_MG :
    null;
  if (!tables) return null;

  const norm = normalize(text);
  if (!norm) return null;

  const phrase = tables.phrases.get(norm);
  if (phrase) return phrase;

  const translatedWords = norm.split(' ').map((word) => tables.words.get(word));
  if (translatedWords.some((word) => word === undefined)) return null;
  return translatedWords.join(' ');
}
