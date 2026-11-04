/*
# Create translations table (single-tenant, no auth)

1. New Tables
- `translations`
  - `id` (uuid, primary key)
  - `source_text` (text, not null) — original Malagasy transcription
  - `french_text` (text) — French translation
  - `chinese_text` (text) — Chinese translation
  - `created_at` (timestamptz, default now())
2. Security
- Enable RLS on `translations`.
- Grant CRUD to `anon` + `authenticated` so the Data API can reach the table.
- Allow anon + authenticated CRUD because the data is intentionally shared/public (no sign-in screen).
*/

CREATE TABLE IF NOT EXISTS translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_text text NOT NULL,
  french_text text,
  chinese_text text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE translations ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON translations TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_translations" ON translations;
CREATE POLICY "anon_select_translations" ON translations FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_translations" ON translations;
CREATE POLICY "anon_insert_translations" ON translations FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_translations" ON translations;
CREATE POLICY "anon_update_translations" ON translations FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_translations" ON translations;
CREATE POLICY "anon_delete_translations" ON translations FOR DELETE
TO anon, authenticated USING (true);
