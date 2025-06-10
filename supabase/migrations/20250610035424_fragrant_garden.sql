/*
  # Add missing schema elements

  1. Schema Updates
    - Add `name` column to `token_info` table
    - Create `token_sales_details` table with required columns
    
  2. New Tables
    - `token_sales_details`
      - `token_id` (text, primary key)
      - `address` (text)
      - `network` (text)
      - `funds_raised_usdc` (numeric, default 0)
      - `participants` (integer, default 0)
      - `transactions` (integer, default 0)
      - `updated_at` (timestamp with timezone, default now())
      
  3. Security
    - Enable RLS on `token_sales_details` table
    - Add policies for public read access and service role full access
    
  4. Changes
    - Add `name` column to existing `token_info` table
    - Add indexes for performance optimization
*/

-- Add missing name column to token_info table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'token_info' AND column_name = 'name'
  ) THEN
    ALTER TABLE token_info ADD COLUMN name text;
  END IF;
END $$;

-- Create token_sales_details table if it doesn't exist
CREATE TABLE IF NOT EXISTS token_sales_details (
  token_id text PRIMARY KEY,
  address text,
  network text,
  funds_raised_usdc numeric DEFAULT 0,
  participants integer DEFAULT 0,
  transactions integer DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on token_sales_details table
ALTER TABLE token_sales_details ENABLE ROW LEVEL SECURITY;

-- Add policies for token_sales_details
CREATE POLICY "Allow public read access to token_sales_details"
  ON token_sales_details
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow service role full access to token_sales_details"
  ON token_sales_details
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS token_sales_details_updated_at_idx 
  ON token_sales_details USING btree (updated_at);

CREATE INDEX IF NOT EXISTS token_sales_details_network_idx 
  ON token_sales_details USING btree (network);