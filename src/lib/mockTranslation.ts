interface MockPhrase {
  original: string;
  translations: Record<string, string>;
}

const MOCK_PHRASES: MockPhrase[] = [
  {
    original: 'Salama, manao ahoana ianao?',
    translations: { mg: 'Salama, manao ahoana ianao?', fr: 'Bonjour, comment allez-vous ?', en: 'Hello, how are you?' },
  },
  {
    original: 'Faly aho mahita anao.',
    translations: { mg: 'Faly aho mahita anao.', fr: 'Ravi de te voir.', en: 'Glad to see you.' },
  },
  {
    original: 'Azafady, afaka miresaka kely ve isika?',
    translations: {
      mg: 'Azafady, afaka miresaka kely ve isika?',
      fr: 'Excusez-moi, on peut parler un instant ?',
      en: 'Excuse me, can we talk for a moment?',
    },
  },
];

export function getMockTranslation(index: number, targetCode: string): { original: string; translated: string } {
  const phrase = MOCK_PHRASES[index % MOCK_PHRASES.length];
  return {
    original: phrase.original,
    translated: phrase.translations[targetCode] ?? phrase.translations.en,
  };
}
