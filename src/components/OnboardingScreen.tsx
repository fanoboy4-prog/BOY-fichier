import { useState, useMemo } from 'react';
import { Search, X, ArrowRight, Languages, Check } from 'lucide-react';
import { ALL_LANGS, findLang } from '@/lib/languages';
import type { LangOption } from '@/lib/languages';

interface OnboardingScreenProps {
  onComplete: (myLang: string, targetLang: string) => void;
  initialMyLang?: string;
  initialTargetLang?: string;
  isSettings?: boolean;
}

export function OnboardingScreen({ onComplete, initialMyLang, initialTargetLang, isSettings }: OnboardingScreenProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [myLang, setMyLang] = useState(initialMyLang ?? '');
  const [targetLang, setTargetLang] = useState(initialTargetLang ?? '');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return ALL_LANGS;
    return ALL_LANGS.filter((l) => l.label.toLowerCase().includes(q) || l.code.includes(q));
  }, [search]);

  const myLangOpt = myLang ? findLang(myLang) : null;
  const targetLangOpt = targetLang ? findLang(targetLang) : null;

  const handleDone = () => {
    if (myLang && targetLang) {
      onComplete(myLang, targetLang);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#075E54] to-[#054940] flex flex-col items-center px-6 py-10">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-2">
        <Languages className="w-7 h-7 text-white" />
        <h1 className="text-white text-2xl font-bold">
          LIVE <span className="text-[#25D366]">TRANSLATION</span>
        </h1>
      </div>
      <p className="text-white/50 text-xs mb-8 lowercase tracking-wide">app by boy STALL</p>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        <div className={`w-3 h-3 rounded-full transition-colors ${step === 1 ? 'bg-[#25D366]' : 'bg-white/30'}`} />
        <div className={`w-3 h-3 rounded-full transition-colors ${step === 2 ? 'bg-[#25D366]' : 'bg-white/30'}`} />
      </div>

      {/* Step content */}
      {step === 1 ? (
        <div className="w-full max-w-sm flex flex-col items-center">
          <div className="mb-4 text-center">
            <h2 className="text-white text-lg font-bold mb-1">I speak...</h2>
            <p className="text-white/50 text-sm">Choose your language — used for speech recognition</p>
          </div>
          {myLangOpt && (
            <div className="flex items-center gap-2 mb-3 bg-[#25D366]/20 rounded-full px-4 py-2">
              <span className="text-2xl">{myLangOpt.flag}</span>
              <span className="text-white font-bold text-sm">{myLangOpt.label}</span>
              <Check className="w-4 h-4 text-[#25D366]" />
            </div>
          )}
          <LanguageGrid
            langs={filtered}
            search={search}
            onSearch={setSearch}
            selected={myLang}
            onSelect={(code) => setMyLang(code)}
          />
          <button
            onClick={() => setStep(2)}
            disabled={!myLang}
            className="mt-4 flex items-center gap-2 px-6 py-3 rounded-xl bg-[#25D366] text-white font-bold text-sm hover:bg-[#1da851] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="w-full max-w-sm flex flex-col items-center">
          <div className="mb-4 text-center">
            <h2 className="text-white text-lg font-bold mb-1">Translate to...</h2>
            <p className="text-white/50 text-sm">Choose the output language — used for translation & voice</p>
          </div>
          {targetLangOpt && (
            <div className="flex items-center gap-2 mb-3 bg-[#25D366]/20 rounded-full px-4 py-2">
              <span className="text-2xl">{targetLangOpt.flag}</span>
              <span className="text-white font-bold text-sm">{targetLangOpt.label}</span>
              <Check className="w-4 h-4 text-[#25D366]" />
            </div>
          )}
          <LanguageGrid
            langs={filtered}
            search={search}
            onSearch={setSearch}
            selected={targetLang}
            onSelect={(code) => setTargetLang(code)}
          />
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 text-white font-bold text-sm hover:bg-white/20 transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleDone}
              disabled={!targetLang}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#25D366] text-white font-bold text-sm hover:bg-[#1da851] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSettings ? 'Save' : 'Start'} <Check className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function LanguageGrid({
  langs,
  search,
  onSearch,
  selected,
  onSelect,
}: {
  langs: LangOption[];
  search: string;
  onSearch: (v: string) => void;
  selected: string;
  onSelect: (code: string) => void;
}) {
  return (
    <div className="w-full bg-white/10 backdrop-blur-sm rounded-2xl p-3 max-h-[50vh] overflow-y-auto">
      {/* Search */}
      <div className="flex items-center gap-2 bg-white/90 rounded-full px-3 py-1.5 mb-2 sticky top-0">
        <Search className="w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search 60 languages..."
          className="flex-1 text-sm bg-transparent outline-none text-gray-800 placeholder:text-gray-400"
        />
        {search && (
          <button onClick={() => onSearch('')} className="text-gray-400 hover:text-gray-600">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {/* Grid */}
      <div className="grid grid-cols-3 gap-1.5">
        {langs.map((lang) => (
          <button
            key={lang.code}
            onClick={() => onSelect(lang.code)}
            className={`flex flex-col items-center gap-1 py-3 rounded-xl transition-all ${
              selected === lang.code
                ? 'bg-[#25D366] text-white scale-105 shadow-md'
                : 'bg-white/10 text-white/80 hover:bg-white/20'
            }`}
          >
            <span className="text-2xl">{lang.flag}</span>
            <span className="text-[10px] font-semibold leading-tight text-center">{lang.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
