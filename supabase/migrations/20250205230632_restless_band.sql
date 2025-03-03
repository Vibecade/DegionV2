/*
  # Add token sentiment tracking

  1. New Tables
    - `token_sentiment`
      - `id` (uuid, primary key)
      - `token_id` (text, references tokens)
      - `sentiment` (text, either 'rocket' or 'poop')
      - `created_at` (timestamp)
      - `ip_hash` (text, to prevent multiple votes from same IP)

  2. Security
    - Enable RLS
    - Allow public to read sentiment data
    - Allow anonymous users to insert votes
*/

CREATE TABLE IF NOT EXISTS token_sentiment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id text NOT NULL,
  sentiment text NOT NULL CHECK (sentiment IN ('rocket', 'poop')),
  created_at timestamptz NOT NULL DEFAULT now(),
  ip_hash text NOT NULL
);

-- Create unique constraint to prevent multiple votes from same IP for same token
CREATE UNIQUE INDEX token_sentiment_ip_token_idx ON token_sentiment (token_id, ip_hash);

ALTER TABLE token_sentiment ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read sentiment data
CREATE POLICY "Allow public read access to token sentiment"
  ON token_sentiment
  FOR SELECT
  TO public
  USING (true);

-- Allow anonymous users to insert votes
CREATE POLICY "Allow anonymous users to vote"
  ON token_sentiment
  FOR INSERT
  TO anon
  WITH CHECK (true);