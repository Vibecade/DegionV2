/*
  # Fix token prices RLS policies

  1. Changes
    - Update RLS policies to allow anonymous users to insert/update prices
    - Keep public read access
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Allow public read access to token prices" ON token_prices;
DROP POLICY IF EXISTS "Allow service role to update token prices" ON token_prices;

-- Create new policies
CREATE POLICY "Allow public read access to token prices"
  ON token_prices
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow anonymous users to insert and update prices"
  ON token_prices
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);