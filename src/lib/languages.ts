export interface LangOption {
  code: string;
  speech: string;
  stt: string;
  label: string;
  flag: string;
}

export const ALL_LANGS: LangOption[] = [
  { code: 'mg', speech: 'fr-FR', stt: 'mg-MG', label: 'Malagasy', flag: '🇲🇬' },
  { code: 'fr', speech: 'fr-FR', stt: 'fr-FR', label: 'Français', flag: '🇫🇷' },
  { code: 'en', speech: 'en-US', stt: 'en-US', label: 'English', flag: '🇺🇸' },
  { code: 'zh', speech: 'zh-CN', stt: 'zh-CN', label: '中文', flag: '🇨🇳' },
  { code: 'ja', speech: 'ja-JP', stt: 'ja-JP', label: '日本語', flag: '🇯🇵' },
  { code: 'ko', speech: 'ko-KR', stt: 'ko-KR', label: '한국어', flag: '🇰🇷' },
  { code: 'de', speech: 'de-DE', stt: 'de-DE', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'es', speech: 'es-ES', stt: 'es-ES', label: 'Español', flag: '🇪🇸' },
  { code: 'it', speech: 'it-IT', stt: 'it-IT', label: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', speech: 'pt-PT', stt: 'pt-PT', label: 'Português', flag: '🇵🇹' },
  { code: 'ru', speech: 'ru-RU', stt: 'ru-RU', label: 'Русский', flag: '🇷🇺' },
  { code: 'ar', speech: 'ar-SA', stt: 'ar-SA', label: 'العربية', flag: '🇸🇦' },
  { code: 'hi', speech: 'hi-IN', stt: 'hi-IN', label: 'हिन्दी', flag: '🇮🇳' },
  { code: 'tr', speech: 'tr-TR', stt: 'tr-TR', label: 'Türkçe', flag: '🇹🇷' },
  { code: 'th', speech: 'th-TH', stt: 'th-TH', label: 'ไทย', flag: '🇹🇭' },
  { code: 'vi', speech: 'vi-VN', stt: 'vi-VN', label: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'id', speech: 'id-ID', stt: 'id-ID', label: 'Indonesia', flag: '🇮🇩' },
  { code: 'sw', speech: 'sw-KE', stt: 'sw-KE', label: 'Kiswahili', flag: '🇰🇪' },
  { code: 'nl', speech: 'nl-NL', stt: 'nl-NL', label: 'Nederlands', flag: '🇳🇱' },
  { code: 'pl', speech: 'pl-PL', stt: 'pl-PL', label: 'Polski', flag: '🇵🇱' },
  { code: 'uk', speech: 'uk-UA', stt: 'uk-UA', label: 'Українська', flag: '🇺🇦' },
  { code: 'cs', speech: 'cs-CZ', stt: 'cs-CZ', label: 'Čeština', flag: '🇨🇿' },
  { code: 'sv', speech: 'sv-SE', stt: 'sv-SE', label: 'Svenska', flag: '🇸🇪' },
  { code: 'da', speech: 'da-DK', stt: 'da-DK', label: 'Dansk', flag: '🇩🇰' },
  { code: 'fi', speech: 'fi-FI', stt: 'fi-FI', label: 'Suomi', flag: '🇫🇮' },
  { code: 'no', speech: 'nb-NO', stt: 'nb-NO', label: 'Norsk', flag: '🇳🇴' },
  { code: 'el', speech: 'el-GR', stt: 'el-GR', label: 'Ελληνικά', flag: '🇬🇷' },
  { code: 'ro', speech: 'ro-RO', stt: 'ro-RO', label: 'Română', flag: '🇷🇴' },
  { code: 'hu', speech: 'hu-HU', stt: 'hu-HU', label: 'Magyar', flag: '🇭🇺' },
  { code: 'sk', speech: 'sk-SK', stt: 'sk-SK', label: 'Slovenčina', flag: '🇸🇰' },
  { code: 'bg', speech: 'bg-BG', stt: 'bg-BG', label: 'Български', flag: '🇧🇬' },
  { code: 'hr', speech: 'hr-HR', stt: 'hr-HR', label: 'Hrvatski', flag: '🇭🇷' },
  { code: 'sr', speech: 'sr-RS', stt: 'sr-RS', label: 'Српски', flag: '🇷🇸' },
  { code: 'sl', speech: 'sl-SI', stt: 'sl-SI', label: 'Slovenščina', flag: '🇸🇮' },
  { code: 'lt', speech: 'lt-LT', stt: 'lt-LT', label: 'Lietuvių', flag: '🇱🇹' },
  { code: 'lv', speech: 'lv-LV', stt: 'lv-LV', label: 'Latviešu', flag: '🇱🇻' },
  { code: 'et', speech: 'et-EE', stt: 'et-EE', label: 'Eesti', flag: '🇪🇪' },
  { code: 'fa', speech: 'fa-IR', stt: 'fa-IR', label: 'فارسی', flag: '🇮🇷' },
  { code: 'ur', speech: 'ur-PK', stt: 'ur-PK', label: 'اردو', flag: '🇵🇰' },
  { code: 'bn', speech: 'bn-IN', stt: 'bn-IN', label: 'বাংলা', flag: '🇧🇩' },
  { code: 'ta', speech: 'ta-IN', stt: 'ta-IN', label: 'தமிழ்', flag: '🇮🇳' },
  { code: 'te', speech: 'te-IN', stt: 'te-IN', label: 'తెలుగు', flag: '🇮🇳' },
  { code: 'mr', speech: 'mr-IN', stt: 'mr-IN', label: 'मराठी', flag: '🇮🇳' },
  { code: 'gu', speech: 'gu-IN', stt: 'gu-IN', label: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'pa', speech: 'pa-IN', stt: 'pa-IN', label: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
  { code: 'ms', speech: 'ms-MY', stt: 'ms-MY', label: 'Melayu', flag: '🇲🇾' },
  { code: 'my', speech: 'my-MM', stt: 'my-MM', label: 'ဗမာ', flag: '🇲🇲' },
  { code: 'km', speech: 'km-KH', stt: 'km-KH', label: 'ខ្មែរ', flag: '🇰🇭' },
  { code: 'lo', speech: 'lo-LA', stt: 'lo-LA', label: 'ລາວ', flag: '🇱🇦' },
  { code: 'ne', speech: 'ne-NP', stt: 'ne-NP', label: 'नेपाली', flag: '🇳🇵' },
  { code: 'si', speech: 'si-LK', stt: 'si-LK', label: 'සිංහල', flag: '🇱🇰' },
  { code: 'am', speech: 'am-ET', stt: 'am-ET', label: 'አማርኛ', flag: '🇪🇹' },
  { code: 'ha', speech: 'ha-NG', stt: 'ha-NG', label: 'Hausa', flag: '🇳🇬' },
  { code: 'yo', speech: 'yo-NG', stt: 'yo-NG', label: 'Yorùbá', flag: '🇳🇬' },
  { code: 'zu', speech: 'zu-ZA', stt: 'zu-ZA', label: 'isiZulu', flag: '🇿🇦' },
  { code: 'af', speech: 'af-ZA', stt: 'af-ZA', label: 'Afrikaans', flag: '🇿🇦' },
  { code: 'he', speech: 'he-IL', stt: 'he-IL', label: 'עברית', flag: '🇮🇱' },
  { code: 'is', speech: 'is-IS', stt: 'is-IS', label: 'Íslenska', flag: '🇮🇸' },
  { code: 'ga', speech: 'ga-IE', stt: 'ga-IE', label: 'Gaeilge', flag: '🇮🇪' },
  { code: 'cy', speech: 'cy-GB', stt: 'cy-GB', label: 'Cymraeg', flag: '🏴' },
];

export function findLang(code: string): LangOption {
  return ALL_LANGS.find((l) => l.code === code) ?? ALL_LANGS[0];
}
