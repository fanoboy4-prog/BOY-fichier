export interface CountryCode {
  code: string;
  dial: string;
  flag: string;
  name: string;
}

export const COUNTRY_CODES: CountryCode[] = [
  { code: 'MG', dial: '+261', flag: '🇲🇬', name: 'Madagascar' },
  { code: 'FR', dial: '+33', flag: '🇫🇷', name: 'France' },
  { code: 'US', dial: '+1', flag: '🇺🇸', name: 'USA' },
  { code: 'GB', dial: '+44', flag: '🇬🇧', name: 'UK' },
  { code: 'CN', dial: '+86', flag: '🇨🇳', name: 'China' },
  { code: 'DE', dial: '+49', flag: '🇩🇪', name: 'Germany' },
  { code: 'ES', dial: '+34', flag: '🇪🇸', name: 'Spain' },
  { code: 'IT', dial: '+39', flag: '🇮🇹', name: 'Italy' },
  { code: 'RU', dial: '+7', flag: '🇷🇺', name: 'Russia' },
  { code: 'JP', dial: '+81', flag: '🇯🇵', name: 'Japan' },
  { code: 'KR', dial: '+82', flag: '🇰🇷', name: 'South Korea' },
  { code: 'SA', dial: '+966', flag: '🇸🇦', name: 'Saudi Arabia' },
  { code: 'BR', dial: '+55', flag: '🇧🇷', name: 'Brazil' },
  { code: 'IN', dial: '+91', flag: '🇮🇳', name: 'India' },
  { code: 'ZA', dial: '+27', flag: '🇿🇦', name: 'South Africa' },
  { code: 'CA', dial: '+1', flag: '🇨🇦', name: 'Canada' },
  { code: 'AU', dial: '+61', flag: '🇦🇺', name: 'Australia' },
  { code: 'EG', dial: '+20', flag: '🇪🇬', name: 'Egypt' },
  { code: 'NG', dial: '+234', flag: '🇳🇬', name: 'Nigeria' },
  { code: 'TH', dial: '+66', flag: '🇹🇭', name: 'Thailand' },
];

export interface Contact {
  id: string;
  name: string;
  phone: string;
  countryCode: string;
  createdAt: number;
  requestId?: string;
}

export type CallStatus = 'outgoing' | 'incoming' | 'missed';

export interface CallLogEntry {
  id: string;
  contactId: string;
  contactName: string;
  phone: string;
  type: 'voice' | 'video';
  direction: 'outgoing' | 'incoming';
  status: CallStatus;
  duration: number;
  timestamp: number;
}

export type Tab = 'chats' | 'calls' | 'contacts';
