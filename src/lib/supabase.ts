import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface TranslationRecord {
  id: string;
  source_text: string;
  french_text: string | null;
  chinese_text: string | null;
  created_at: string;
}
