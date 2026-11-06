import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://nqjunlfmjhladiivvhoy.supabase.co';
const supabaseAnonKey = 'sb_publishable_-ASIkM69oPIN9IRIkuXxFg_M6NXmhIB';
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface TranslationRecord {
  id: string;
  source_text: string;
  french_text: string | null;
  chinese_text: string | null;
  created_at: string;
}
