/*
  # Token Prices Cache Table

  1. New Tables
    - `token_prices`
      - `id` (uuid, primary key)
      - `token_id` (text, unique)
      - `price` (numeric)
      - `roi_value` (numeric)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `token_prices` table
    - Add policy for authenticated users to read all prices
    - Add policy for service role to update prices
*/

CREATE TABLE IF NOT EXISTS token_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id text UNIQUE NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  roi_value numeric NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE token_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to token prices"
  ON token_prices
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow service role to update token prices"
  ON token_prices
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);