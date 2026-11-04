import { COUNTRY_CODES } from '@/lib/contacts';

export function phoneKey(countryCode: string, phone: string): string {
  const dial = (COUNTRY_CODES.find((c) => c.code === countryCode)?.dial ?? '').replace(/\D/g, '');
  let local = phone.replace(/\D/g, '');
  if (dial && local.startsWith(dial)) local = local.slice(dial.length);
  local = local.replace(/^0+/, '');
  if (!local) return '';
  return `${dial}${local}`;
}

export function dialLabel(countryCode: string, phone: string): string {
  const country = COUNTRY_CODES.find((c) => c.code === countryCode);
  return `${country?.flag ?? ''} ${country?.dial ?? ''} ${phone}`.trim();
}
