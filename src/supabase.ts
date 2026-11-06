import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nqjunlfmjhladiivvhoy.supabase.co';
const supabaseKey = 'sb_publishable_-ASIkM69oPIN9IRIkuXxFg_M6NXmhIB';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Fonction nettoyage numéro - ilay efa nataontsika
export function cleanPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
  if (cleaned.startsWith('+261')) cleaned = '0' + cleaned.slice(4);
  else if (cleaned.startsWith('261')) cleaned = '0' + cleaned.slice(3);
  return cleaned;
}
