interface TranslateResponse {
  translations: {
    fr?: string;
    zh?: string;
    [key: string]: string | undefined;
  };
}

const DEMO_TRANSLATIONS: Record<string, { fr: string; zh: string }> = {
  'manao ahoana': { fr: 'Bonjour', zh: '你好' },
  'salama': { fr: 'Bonjour', zh: '你好' },
  'manao ahoana ianao': { fr: 'Comment allez-vous', zh: '你好吗' },
  'misaotra': { fr: 'Merci', zh: '谢谢' },
  'misaotra betsaka': { fr: 'Merci beaucoup', zh: '非常感谢' },
  'veloma': { fr: 'Au revoir', zh: '再见' },
  'mandrapihavana': { fr: 'À bientôt', zh: '回头见' },
  'eny': { fr: 'Oui', zh: '是的' },
  'tsia': { fr: 'Non', zh: '不' },
  'azafady': { fr: "S'il vous plaît", zh: '请' },
  'miala tsiny': { fr: 'Pardon', zh: '对不起' },
  'tompo': { fr: 'Monsieur', zh: '先生' },
  'tompovavy': { fr: 'Madame', zh: '女士' },
  'iza ny anaranao': { fr: 'Quel est votre nom', zh: '你叫什么名字' },
  '... ny anarako': { fr: 'Je m\'appelle ...', zh: '我叫...' },
  'manahoana aho': { fr: 'Comment ça va', zh: '你好吗' },
  'tsara aho': { fr: 'Je vais bien', zh: '我很好' },
  'tsy tsara aho': { fr: 'Je ne vais pas bien', zh: '我不好' },
  'inona ny ora': { fr: 'Quelle heure est-il', zh: '几点了' },
  'izaany ny fotoana': { fr: 'Quel temps fait-il', zh: '天气怎么样' },
  'mafana': { fr: 'Il fait chaud', zh: '天气热' },
  'maraina': { fr: 'Il fait froid', zh: '天气冷' },
  'mihinana aho': { fr: 'Je mange', zh: '我在吃' },
  'mangetaheta aho': { fr: "J'ai soif", zh: '我渴了' },
  'teraka aho': { fr: 'J\'ai faim', zh: '我饿了' },
  'tsy mahazo aho': { fr: 'Je ne comprends pas', zh: '我不明白' },
  'azoko': { fr: 'Je comprends', zh: '我明白了' },
  'avereno azafady': { fr: 'Répétez s\'il vous plaît', zh: '请再说一遍' },
  'miteny malagasy tsara': { fr: 'Parle bien malgache', zh: '说马尔加什语很好' },
  'fitiavana': { fr: 'Amour', zh: '爱' },
  'fahanginana': { fr: 'Silence', zh: '安静' },
};

export function getDemoTranslation(text: string): { fr: string; zh: string } | null {
  const key = text.trim().toLowerCase();
  return DEMO_TRANSLATIONS[key] ?? null;
}

export async function translateText(
  text: string,
  source: string,
  targets: string[],
): Promise<Record<string, string>> {
  const demo = getDemoTranslation(text);
  if (demo) {
    const result: Record<string, string> = {};
    for (const target of targets) {
      if (target === 'fr') result[target] = demo.fr;
      else if (target === 'zh') result[target] = demo.zh;
      else result[target] = '';
    }
    return result;
  }

  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/translate`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
  if (anonKey) {
    headers['Authorization'] = `Bearer ${anonKey}`;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ text, source, targets }),
  });

  if (!res.ok) {
    throw new Error(`Translation request failed (${res.status})`);
  }

  const data = (await res.json()) as TranslateResponse;
  if (!data || !data.translations) {
    throw new Error('Invalid translation response');
  }

  const result: Record<string, string> = {};
  for (const target of targets) {
    result[target] = data.translations[target] ?? '';
  }
  return result;
}
