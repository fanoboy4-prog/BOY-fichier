/*
# Create WebRTC signaling tables (single-tenant, no auth)

1. New Tables
- `rtc_signals`
  - `id` (uuid, primary key)
  - `room_code` (text, not null) — room identifier like "MG-1234"
  - `peer_id` (text, not null) — unique per browser tab (uuid generated client-side)
  - `type` (text, not null) — signal type: 'offer', 'answer', 'ice'
  - `payload` (jsonb, not null) — the SDP or ICE candidate data
  - `created_at` (timestamptz, default now())
- `chat_messages`
  - `id` (uuid, primary key)
  - `room_code` (text, not null)
  - `sender_peer_id` (text, not null)
  - `source_text` (text, not null) — original Malagasy text
  - `french_text` (text) — French translation
  - `chinese_text` (text) — Chinese translation
  - `created_at` (timestamptz, default now())
2. Security
- Enable RLS on both tables.
- Grant CRUD to `anon` + `authenticated` (no sign-in screen, intentionally shared data).
- Allow anon + authenticated full CRUD on both tables.
3. Indexes
- Index on `room_code` + `created_at` for efficient signal polling and chat history.
*/

CREATE TABLE IF NOT EXISTS rtc_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code text NOT NULL,
  peer_id text NOT NULL,
  type text NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rtc_signals_room ON rtc_signals (room_code, created_at);

ALTER TABLE rtc_signals ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON rtc_signals TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_rtc_signals" ON rtc_signals;
CREATE POLICY "anon_select_rtc_signals" ON rtc_signals FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_rtc_signals" ON rtc_signals;
CREATE POLICY "anon_insert_rtc_signals" ON rtc_signals FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_rtc_signals" ON rtc_signals;
CREATE POLICY "anon_update_rtc_signals" ON rtc_signals FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_rtc_signals" ON rtc_signals;
CREATE POLICY "anon_delete_rtc_signals" ON rtc_signals FOR DELETE
TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code text NOT NULL,
  sender_peer_id text NOT NULL,
  source_text text NOT NULL,
  french_text text,
  chinese_text text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_room ON chat_messages (room_code, created_at);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON chat_messages TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_chat_messages" ON chat_messages;
CREATE POLICY "anon_select_chat_messages" ON chat_messages FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_chat_messages" ON rtc_signals;
CREATE POLICY "anon_insert_chat_messages" ON chat_messages FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_chat_messages" ON chat_messages;
CREATE POLICY "anon_delete_chat_messages" ON chat_messages FOR DELETE
TO anon, authenticated USING (true);
